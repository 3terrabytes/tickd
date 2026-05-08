const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { ITEMS, itemById } = require('../data/items');
const router = express.Router();

router.use(auth);

// Get all shop items + user's gold + owned items
router.get('/shop', async (req, res) => {
  const { rows: userRows } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
  const { rows: owned } = await pool.query('SELECT item_id FROM user_inventory WHERE user_id = $1', [req.userId]);
  const ownedIds = owned.map(r => r.item_id);
  res.json({ gold: userRows[0]?.gold || 0, items: ITEMS, ownedIds });
});

// Buy an item
router.post('/shop/buy/:itemId', async (req, res) => {
  const item = itemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { rows } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
  const gold = rows[0]?.gold || 0;

  if (gold < item.cost) return res.status(400).json({ error: 'Not enough gold' });

  try {
    await pool.query('INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)', [req.userId, item.id]);
    await pool.query('UPDATE users SET gold = gold - $1 WHERE id = $2', [item.cost, req.userId]);
    const { rows: updated } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
    res.json({ success: true, gold: updated[0].gold });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already owned' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get inventory + equipped
router.get('/inventory', async (req, res) => {
  const { rows: inv } = await pool.query('SELECT item_id FROM user_inventory WHERE user_id = $1', [req.userId]);
  const { rows: eq } = await pool.query('SELECT * FROM user_equipped WHERE user_id = $1', [req.userId]);
  const items = inv.map(r => itemById(r.item_id)).filter(Boolean);
  res.json({ items, equipped: eq[0] || {} });
});

// Equip an item
router.post('/equip/:itemId', async (req, res) => {
  const item = itemById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  // Verify owned
  const { rows } = await pool.query(
    'SELECT id FROM user_inventory WHERE user_id = $1 AND item_id = $2',
    [req.userId, item.id]
  );
  if (!rows.length) return res.status(403).json({ error: 'Not in inventory' });

  await pool.query(`
    INSERT INTO user_equipped (user_id, ${item.type}) VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET ${item.type} = $2
  `, [req.userId, item.id]);

  res.json({ success: true });
});

// Unequip a slot
router.delete('/equip/:slot', async (req, res) => {
  const slot = req.params.slot;
  if (!['weapon','armor','banner','badge'].includes(slot))
    return res.status(400).json({ error: 'Invalid slot' });

  await pool.query(`
    INSERT INTO user_equipped (user_id, ${slot}) VALUES ($1, NULL)
    ON CONFLICT (user_id) DO UPDATE SET ${slot} = NULL
  `, [req.userId]);

  res.json({ success: true });
});

module.exports = router;
