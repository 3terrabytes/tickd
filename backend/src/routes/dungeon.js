const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { addXP } = require('../utils/xp');
const { ATTACKS, attackById, attacksForClass, DEFAULT_LOADOUT } = require('../data/attacks');
const { MONSTERS, monsterById, generateRun } = require('../data/monsters');
const { itemById, weaponClassOf } = require('../data/items');

const router = express.Router();
router.use(auth);

// Resolve the user's current equipped weapon class, if any.
async function userWeaponClass(userId) {
  const { rows } = await pool.query(
    'SELECT weapon FROM user_equipped WHERE user_id = $1',
    [userId]
  );
  const weaponId = rows[0]?.weapon;
  if (!weaponId) return null;
  return weaponClassOf(itemById(weaponId));
}

// Total magic from the user's equipped gear — bonus damage in the dungeon.
async function userMagic(userId) {
  const { rows } = await pool.query(
    'SELECT weapon, armor, badge, companion FROM user_equipped WHERE user_id = $1',
    [userId]
  );
  const row = rows[0] || {};
  let total = 0;
  for (const id of Object.values(row)) {
    if (!id) continue;
    total += itemById(id)?.magic || 0;
  }
  return total;
}

// Total armor — derived from equipped armor's magic. Reduces incoming damage.
async function userArmor(userId) {
  const { rows } = await pool.query(
    'SELECT armor FROM user_equipped WHERE user_id = $1',
    [userId]
  );
  const armor = itemById(rows[0]?.armor);
  return armor?.magic || 0;
}

// Get the loadout, falling back to defaults if the user has never set one.
// Also strips any attacks that are no longer valid for the current weapon —
// the client renders the result so the UI never shows orphaned moves.
router.get('/loadout', async (req, res) => {
  try {
    const [{ rows }, weaponClass, magic, armor] = await Promise.all([
      pool.query('SELECT slot1, slot2, slot3, slot4 FROM user_attacks WHERE user_id = $1', [req.userId]),
      userWeaponClass(req.userId),
      userMagic(req.userId),
      userArmor(req.userId),
    ]);
    const row = rows[0];
    const stored = row ? [row.slot1, row.slot2, row.slot3, row.slot4] : [];
    const available = attacksForClass(weaponClass);
    const availableIds = new Set(available.map(a => a.id));

    // Prefer stored slot if still usable, otherwise fall back to default order.
    const slots = [];
    for (let i = 0; i < 4; i++) {
      const candidate = stored[i] && availableIds.has(stored[i]) ? stored[i] : DEFAULT_LOADOUT[i];
      slots.push(candidate);
    }

    res.json({
      slots,
      slotDetails: slots.map(id => attackById(id)).filter(Boolean),
      available,
      weaponClass,
      magic,
      armor,
    });
  } catch (err) {
    console.error('dungeon/loadout error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save the 4-slot loadout. Validates each slot is in the user's available list.
router.post('/loadout', async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots) || slots.length !== 4) {
      return res.status(400).json({ error: 'Need exactly 4 slots' });
    }
    const weaponClass = await userWeaponClass(req.userId);
    const availableIds = new Set(attacksForClass(weaponClass).map(a => a.id));
    for (const id of slots) {
      if (!availableIds.has(id)) {
        return res.status(400).json({ error: `Attack "${id}" not available for your weapon` });
      }
    }
    await pool.query(
      `INSERT INTO user_attacks (user_id, slot1, slot2, slot3, slot4)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET slot1 = EXCLUDED.slot1, slot2 = EXCLUDED.slot2,
           slot3 = EXCLUDED.slot3, slot4 = EXCLUDED.slot4`,
      [req.userId, slots[0], slots[1], slots[2], slots[3]]
    );
    res.json({ success: true, slots });
  } catch (err) {
    console.error('dungeon/loadout save error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start a new dungeon run — server picks the monster sequence.
router.post('/run', async (req, res) => {
  try {
    const sequence = generateRun();
    const monsters = sequence.map(id => monsterById(id));
    res.json({ rooms: monsters });
  } catch (err) {
    console.error('dungeon/run error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Claim XP+gold for defeating a monster. Server validates the monster id but
// trusts that the client actually killed it (battle is client-driven).
router.post('/reward', async (req, res) => {
  try {
    const { monsterId } = req.body;
    const monster = monsterById(monsterId);
    if (!monster) return res.status(400).json({ error: 'Unknown monster' });

    await addXP(req.userId, monster.xp);
    await pool.query(
      'UPDATE users SET gold = gold + $1, lifetime_gold = COALESCE(lifetime_gold, 0) + $1 WHERE id = $2',
      [monster.gold, req.userId]
    );
    const { rows } = await pool.query('SELECT xp, level, gold FROM users WHERE id = $1', [req.userId]);
    res.json({ xp: monster.xp, gold: monster.gold, user: rows[0] });
  } catch (err) {
    console.error('dungeon/reward error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Catalog endpoints — used by the loadout editor.
router.get('/attacks', (req, res) => res.json(ATTACKS));
router.get('/monsters', (req, res) => res.json(MONSTERS));

module.exports = router;
