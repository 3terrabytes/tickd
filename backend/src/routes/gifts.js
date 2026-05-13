const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { itemById } = require('../data/items');
const { addXP } = require('../utils/xp');
const router = express.Router();

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
  const GIFT_XP = { common: 10, rare: 25, epic: 50, legendary: 100 };
  const xpGain = GIFT_XP[item.rarity] || 10;
  await addXP(req.userId, xpGain);

  res.json({ success: true, xp_gained: xpGain });
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
