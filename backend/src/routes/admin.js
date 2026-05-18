const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { ITEMS, itemById } = require('../data/items');
const router = express.Router();

router.use(auth);
router.use(adminOnly);

const USER_FIELDS = `
  id, username, email, xp, level, gold, avatar_color,
  avatar_skin, avatar_hair, avatar_eyes, avatar_hair_style, avatar_gender, avatar_beard,
  is_admin, suspension_type, suspension_reason, suspended_until, suspended_at, suspended_by,
  created_at
`;

const EQUIP_SLOTS = ['weapon', 'armor', 'banner', 'badge', 'companion', 'title'];

// List all users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${USER_FIELDS} FROM users ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('admin/users error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user (with equipped)
router.get('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows: eq } = await pool.query('SELECT * FROM user_equipped WHERE user_id = $1', [req.params.id]);
    const equippedRow = eq[0] || {};
    const equipped = {};
    for (const slot of EQUIP_SLOTS) {
      equipped[slot] = equippedRow[slot] ? itemById(equippedRow[slot]) : null;
    }
    res.json({ ...rows[0], equipped });
  } catch (err) {
    console.error('admin/users/:id error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Inventory
router.get('/users/:id/inventory', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT item_id FROM user_inventory WHERE user_id = $1', [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update xp / gold / level
router.patch('/users/:id', async (req, res) => {
  const { xp, gold, level } = req.body;
  const fields = [];
  const params = [];
  let i = 1;
  if (xp    !== undefined) { fields.push(`xp = $${i++}`);    params.push(parseInt(xp)    || 0); }
  if (gold  !== undefined) { fields.push(`gold = $${i++}`);  params.push(parseInt(gold)  || 0); }
  if (level !== undefined) { fields.push(`level = $${i++}`); params.push(parseInt(level) || 1); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING ${USER_FIELDS}`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('admin patch user error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Grant item
router.post('/users/:id/items/:itemId', async (req, res) => {
  const item = itemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Unknown item' });
  try {
    await pool.query(
      `INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [req.params.id, item.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item (and unequip if equipped in any slot)
router.delete('/users/:id/items/:itemId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_inventory WHERE user_id = $1 AND item_id = $2',
      [req.params.id, req.params.itemId]
    );
    for (const slot of EQUIP_SLOTS) {
      await pool.query(
        `UPDATE user_equipped SET ${slot} = NULL WHERE user_id = $1 AND ${slot} = $2`,
        [req.params.id, req.params.itemId]
      );
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Equip an item on a user (admin can equip any item the user owns)
router.post('/users/:id/equip/:itemId', async (req, res) => {
  const item = itemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Unknown item' });
  if (!EQUIP_SLOTS.includes(item.type)) return res.status(400).json({ error: 'Not equippable' });

  const { rows } = await pool.query(
    'SELECT 1 FROM user_inventory WHERE user_id = $1 AND item_id = $2',
    [req.params.id, item.id]
  );
  if (!rows.length) return res.status(400).json({ error: 'User does not own this item' });

  await pool.query(
    `INSERT INTO user_equipped (user_id, ${item.type}) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET ${item.type} = EXCLUDED.${item.type}`,
    [req.params.id, item.id]
  );
  res.json({ success: true });
});

// Unequip a slot for a user
router.delete('/users/:id/equip/:slot', async (req, res) => {
  const slot = req.params.slot;
  if (!EQUIP_SLOTS.includes(slot)) return res.status(400).json({ error: 'Invalid slot' });
  await pool.query(
    `INSERT INTO user_equipped (user_id, ${slot}) VALUES ($1, NULL)
     ON CONFLICT (user_id) DO UPDATE SET ${slot} = NULL`,
    [req.params.id]
  );
  res.json({ success: true });
});

// Suspend account: warn | temp | perm
// Temp duration can be specified as `minutes`, `hours`, or `days` — whichever
// is most convenient for the caller. They stack (so 1 day + 2 hours works).
router.post('/users/:id/suspend', async (req, res) => {
  const { type, reason, days, hours, minutes } = req.body;
  if (!['warn', 'temp', 'perm'].includes(type)) {
    return res.status(400).json({ error: 'Invalid suspension type' });
  }
  if (parseInt(req.params.id) === req.userId) {
    return res.status(400).json({ error: "You can't suspend yourself" });
  }

  let until = null;
  if (type === 'temp') {
    const totalMinutes =
      (parseFloat(days)    || 0) * 1440 +
      (parseFloat(hours)   || 0) * 60 +
      (parseFloat(minutes) || 0);
    if (!totalMinutes || totalMinutes <= 0) {
      return res.status(400).json({ error: 'Duration required for temporary suspension' });
    }
    until = new Date(Date.now() + totalMinutes * 60 * 1000);
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET
         suspension_type = $1,
         suspension_reason = $2,
         suspended_until = $3,
         suspended_at = NOW(),
         suspended_by = $4,
         warning_seen = false
       WHERE id = $5 RETURNING ${USER_FIELDS}`,
      [type, reason || null, until, req.userId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('admin suspend error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsuspend
router.post('/users/:id/unsuspend', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
         suspension_type = NULL, suspension_reason = NULL,
         suspended_until = NULL, suspended_at = NULL, suspended_by = NULL,
         warning_seen = false
       WHERE id = $1 RETURNING ${USER_FIELDS}`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle admin flag
router.post('/users/:id/admin', async (req, res) => {
  const makeAdmin = !!req.body.is_admin;
  if (parseInt(req.params.id) === req.userId && !makeAdmin) {
    return res.status(400).json({ error: "You can't demote yourself" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING ${USER_FIELDS}`,
      [makeAdmin, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Suggestions management ──
router.get('/suggestions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, user_id, username, title, description, votes, status, created_at
      FROM suggestions ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/suggestions/:id', async (req, res) => {
  const { status } = req.body;
  if (!['open', 'planned', 'done', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE suggestions SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/suggestions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suggestions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Catalog of all equippable / inventoriable items (for the admin UI)
router.get('/items', (req, res) => res.json(ITEMS));

module.exports = router;
