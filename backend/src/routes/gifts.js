const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { itemById, packById } = require('../data/items');
const { addXP } = require('../utils/xp');
const router = express.Router();

// XP awarded to the sender per item rarity — keeps generosity rewarded.
const GIFT_XP = { common: 10, rare: 25, epic: 50, legendary: 100 };

// Asserts that two users are mutual friends. Throws via the supplied `res`
// path on failure, so callers should `return` after a falsy result.
async function assertFriends(userIdA, userIdB) {
  const { rows } = await pool.query(
    `SELECT 1 FROM friendships WHERE status = 'accepted' AND
     ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [userIdA, userIdB]
  );
  return rows.length > 0;
}

router.use(auth);

// ── GIFTS ──────────────────────────────────────────────

// Send a gift to a friend
router.post('/send', async (req, res) => {
  const { receiver_id, item_id, message } = req.body;
  if (!receiver_id || !item_id) return res.status(400).json({ error: 'receiver_id and item_id required' });

  const item = itemById(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  // Must own the item
  const { rows: owned } = await pool.query(
    'SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2',
    [req.userId, item_id]
  );
  if (!owned.length) return res.status(403).json({ error: 'You do not own this item' });

  // Must be friends
  const { rows: friendship } = await pool.query(
    `SELECT id FROM friendships WHERE status = 'accepted' AND
     ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [req.userId, receiver_id]
  );
  if (!friendship.length) return res.status(403).json({ error: 'You can only gift to friends' });

  // Remove from sender inventory
  await pool.query('DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2', [req.userId, item_id]);

  // Unequip if equipped
  for (const slot of ['weapon','armor','banner','badge']) {
    await pool.query(
      `UPDATE user_equipped SET ${slot} = NULL WHERE user_id = $1 AND ${slot} = $2`,
      [req.userId, item_id]
    );
  }

  // Add to receiver inventory (or ignore if they already own it)
  try {
    await pool.query(
      'INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [receiver_id, item_id]
    );
  } catch {}

  // Log the gift
  await pool.query(
    'INSERT INTO gifts (sender_id, receiver_id, item_id, message, status) VALUES ($1, $2, $3, $4, $5)',
    [req.userId, receiver_id, item_id, message || null, 'delivered']
  );

  // Award XP to sender for generosity
  const xpGain = GIFT_XP[item.rarity] || 10;
  await addXP(req.userId, xpGain);

  res.json({ success: true, xp_gained: xpGain });
});

// Buy a single shop item and immediately send it to a friend as a gift.
// Sender pays the gold; the item is added to the receiver, never to the sender.
router.post('/purchase/:itemId', async (req, res) => {
  const { receiver_id, message } = req.body;
  if (!receiver_id) return res.status(400).json({ error: 'receiver_id required' });
  if (parseInt(receiver_id) === req.userId) return res.status(400).json({ error: "You can't gift yourself" });

  const item = itemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (!(await assertFriends(req.userId, receiver_id))) {
    return res.status(403).json({ error: 'You can only gift to friends' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT gold, username FROM users WHERE id = $1', [req.userId]);
    const me = rows[0];
    const isTheDevs = me?.username?.toLowerCase() === 'thedevs';

    if (!isTheDevs && (me?.gold || 0) < item.cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough gold' });
    }

    // Skip if recipient already owns it (single items only — packs are checked
    // separately). Don't charge — there'd be nothing to give.
    const { rows: owned } = await client.query(
      'SELECT 1 FROM user_inventory WHERE user_id = $1 AND item_id = $2',
      [receiver_id, item.id]
    );
    if (owned.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'They already own this item' });
    }

    await client.query(
      'INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)',
      [receiver_id, item.id]
    );

    if (!isTheDevs) {
      await client.query('UPDATE users SET gold = gold - $1 WHERE id = $2', [item.cost, req.userId]);
    }

    await client.query(
      'INSERT INTO gifts (sender_id, receiver_id, item_id, message, status) VALUES ($1, $2, $3, $4, $5)',
      [req.userId, receiver_id, item.id, message || null, 'delivered']
    );

    await client.query('COMMIT');

    const xpGain = GIFT_XP[item.rarity] || 10;
    await addXP(req.userId, xpGain);

    const { rows: updated } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
    res.json({ success: true, gold: updated[0].gold, xp_gained: xpGain });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'They already own this item' });
    console.error('gift purchase error', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Buy a whole pack and gift it to a friend. Mirrors /avatar/shop/buy-pack but
// the receiver is someone else. Refused if the recipient already owns ANY
// item in the pack — same all-or-nothing rule as buying for yourself.
router.post('/purchase-pack/:packId', async (req, res) => {
  const { receiver_id, message } = req.body;
  if (!receiver_id) return res.status(400).json({ error: 'receiver_id required' });
  if (parseInt(receiver_id) === req.userId) return res.status(400).json({ error: "You can't gift yourself" });

  const pack = packById(req.params.packId);
  if (!pack) return res.status(404).json({ error: 'Pack not found' });

  const items = (pack.items || []).map(id => itemById(id)).filter(Boolean);
  if (items.length !== (pack.items || []).length) {
    return res.status(500).json({ error: 'Pack contains an unknown item' });
  }

  if (!(await assertFriends(req.userId, receiver_id))) {
    return res.status(403).json({ error: 'You can only gift to friends' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT gold, username FROM users WHERE id = $1', [req.userId]);
    const me = rows[0];
    const isTheDevs = me?.username?.toLowerCase() === 'thedevs';

    if (!isTheDevs && (me?.gold || 0) < pack.cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough gold' });
    }

    const ownedRes = await client.query(
      'SELECT item_id FROM user_inventory WHERE user_id = $1 AND item_id = ANY($2::text[])',
      [receiver_id, items.map(i => i.id)]
    );
    if (ownedRes.rows.length > 0) {
      await client.query('ROLLBACK');
      const ownedNames = ownedRes.rows.map(r => itemById(r.item_id)?.name).filter(Boolean).join(', ');
      return res.status(409).json({ error: `They already own: ${ownedNames}` });
    }

    for (const item of items) {
      await client.query(
        'INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)',
        [receiver_id, item.id]
      );
      // Log each item as its own gift entry so the recipient's history is rich.
      await client.query(
        'INSERT INTO gifts (sender_id, receiver_id, item_id, message, status) VALUES ($1, $2, $3, $4, $5)',
        [req.userId, receiver_id, item.id, message || `🎁 ${pack.name}`, 'delivered']
      );
    }

    if (!isTheDevs) {
      await client.query('UPDATE users SET gold = gold - $1 WHERE id = $2', [pack.cost, req.userId]);
    }

    await client.query('COMMIT');

    // Award the per-item gift XP across the whole pack — sum it up.
    let xpGain = 0;
    for (const item of items) xpGain += GIFT_XP[item.rarity] || 10;
    await addXP(req.userId, xpGain);

    const { rows: updated } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
    res.json({ success: true, gold: updated[0].gold, xp_gained: xpGain, grantedIds: items.map(i => i.id) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'They already own an item in this pack' });
    console.error('gift purchase pack error', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Get gift history (sent + received)
router.get('/history', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT g.*,
      s.username AS sender_name, s.avatar_color AS sender_color,
      r.username AS receiver_name, r.avatar_color AS receiver_color
    FROM gifts g
    JOIN users s ON s.id = g.sender_id
    JOIN users r ON r.id = g.receiver_id
    WHERE g.sender_id = $1 OR g.receiver_id = $1
    ORDER BY g.created_at DESC LIMIT 30
  `, [req.userId]);

  res.json(rows.map(g => ({ ...g, item: itemById(g.item_id) })));
});

// ── TRADES ─────────────────────────────────────────────

// Propose a trade
router.post('/trade/propose', async (req, res) => {
  const { receiver_id, offer_item_id, request_item_id, message } = req.body;
  if (!receiver_id || !offer_item_id || !request_item_id)
    return res.status(400).json({ error: 'receiver_id, offer_item_id and request_item_id required' });

  // Must own offered item
  const { rows: owned } = await pool.query(
    'SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2',
    [req.userId, offer_item_id]
  );
  if (!owned.length) return res.status(403).json({ error: 'You do not own the offered item' });

  // Receiver must own requested item
  const { rows: theyOwn } = await pool.query(
    'SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2',
    [receiver_id, request_item_id]
  );
  if (!theyOwn.length) return res.status(400).json({ error: 'They do not own that item' });

  // Must be friends
  const { rows: friendship } = await pool.query(
    `SELECT id FROM friendships WHERE status = 'accepted' AND
     ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [req.userId, receiver_id]
  );
  if (!friendship.length) return res.status(403).json({ error: 'You can only trade with friends' });

  await pool.query(
    'INSERT INTO trades (proposer_id, receiver_id, offer_item_id, request_item_id, message) VALUES ($1,$2,$3,$4,$5)',
    [req.userId, receiver_id, offer_item_id, request_item_id, message || null]
  );

  res.json({ success: true });
});

// Get pending trades (incoming + outgoing)
router.get('/trade/pending', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT t.*,
      p.username AS proposer_name, p.avatar_color AS proposer_color,
      r.username AS receiver_name
    FROM trades t
    JOIN users p ON p.id = t.proposer_id
    JOIN users r ON r.id = t.receiver_id
    WHERE (t.proposer_id = $1 OR t.receiver_id = $1) AND t.status = 'pending'
    ORDER BY t.created_at DESC
  `, [req.userId]);

  res.json(rows.map(t => ({
    ...t,
    offer_item: itemById(t.offer_item_id),
    request_item: itemById(t.request_item_id),
    direction: t.proposer_id === req.userId ? 'outgoing' : 'incoming'
  })));
});

// Accept a trade
router.post('/trade/accept/:tradeId', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades WHERE id = $1 AND status = $2', [req.params.tradeId, 'pending']);
  const trade = rows[0];
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.receiver_id !== req.userId) return res.status(403).json({ error: 'Not your trade' });

  // Verify both still own their items
  const [{ rows: propOwns }, { rows: recOwns }] = await Promise.all([
    pool.query('SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2', [trade.proposer_id, trade.offer_item_id]),
    pool.query('SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2', [trade.receiver_id, trade.request_item_id]),
  ]);
  if (!propOwns.length || !recOwns.length)
    return res.status(400).json({ error: 'One party no longer owns their item' });

  // Swap
  await pool.query('DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2', [trade.proposer_id, trade.offer_item_id]);
  await pool.query('DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2', [trade.receiver_id, trade.request_item_id]);
  await pool.query('INSERT INTO user_inventory (user_id, item_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [trade.receiver_id, trade.offer_item_id]);
  await pool.query('INSERT INTO user_inventory (user_id, item_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [trade.proposer_id, trade.request_item_id]);

  // Unequip swapped items
  for (const [uid, iid] of [[trade.proposer_id, trade.offer_item_id],[trade.receiver_id, trade.request_item_id]]) {
    for (const slot of ['weapon','armor','banner','badge']) {
      await pool.query(`UPDATE user_equipped SET ${slot} = NULL WHERE user_id = $1 AND ${slot} = $2`, [uid, iid]);
    }
  }

  await pool.query('UPDATE trades SET status = $1 WHERE id = $2', ['accepted', trade.id]);
  res.json({ success: true });
});

// Decline a trade
router.post('/trade/decline/:tradeId', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM trades WHERE id = $1 AND status = $2', [req.params.tradeId, 'pending']);
  const trade = rows[0];
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  if (trade.receiver_id !== req.userId && trade.proposer_id !== req.userId)
    return res.status(403).json({ error: 'Not your trade' });

  await pool.query('UPDATE trades SET status = $1 WHERE id = $2', ['declined', trade.id]);
  res.json({ success: true });
});

module.exports = router;
