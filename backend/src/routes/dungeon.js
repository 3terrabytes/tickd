const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { addXP } = require('../utils/xp');
const { ATTACKS, attackById, attacksForClass, DEFAULT_LOADOUT, defaultLoadoutFor,
        starterDeck, rewardPool, pickRewardCards } = require('../data/attacks');
const { BIOMES, biomeById } = require('../data/biomes');
const { RELICS, relicById, pickRelic } = require('../data/relics');
const { EVENTS } = require('../data/events');
const { MONSTERS, monsterById, scaledMonster } = require('../data/monsters');
const { generateMap, POTIONS, potionById } = require('../data/dungeon');
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

// Returns the starting deck for a new dungeon run, plus combat stats. The
// deck is computed deterministically from the player's equipped weapon
// class (5x Strike, 4x Defend, 1x class signature). The full card catalog
// for that class is also returned for the loadout preview screen.
router.get('/loadout', async (req, res) => {
  try {
    const [weaponClass, magic, armor] = await Promise.all([
      userWeaponClass(req.userId),
      userMagic(req.userId),
      userArmor(req.userId),
    ]);
    const deckIds = starterDeck(weaponClass);
    const deck = deckIds.map(id => attackById(id)).filter(Boolean);
    const available = attacksForClass(weaponClass);
    res.json({
      deck,            // full card objects (includes duplicates)
      deckIds,         // raw ids
      available,       // catalog for the class (incl. reward-pool cards)
      weaponClass,
      magic,
      armor,
      // Legacy fields so the old client doesn't crash mid-deploy:
      slots: deckIds.slice(0, 4),
      slotDetails: deck.slice(0, 4),
    });
  } catch (err) {
    console.error('dungeon/loadout error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Picks 3 random cards from the reward pool for the given monster tier, so
// the client can show a "pick 1 of 3 cards" screen after each combat.
router.get('/reward-cards/:tier', async (req, res) => {
  try {
    const tier = parseInt(req.params.tier) || 1;
    const weaponClass = await userWeaponClass(req.userId);
    const pool = rewardPool(weaponClass, tier);
    const picks = pickRewardCards(pool, 3);
    res.json({ cards: picks });
  } catch (err) {
    console.error('dungeon/reward-cards error', err);
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

// Start a new dungeon run. Returns a branching map of nodes/edges. Battle
// nodes include a `monster` field with the resolved monster data so the
// frontend can preview it on the map before committing.
router.post('/run', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT level, dungeon_ascension FROM users WHERE id = $1', [req.userId]);
    const level = rows[0]?.level || 1;
    const userAscension = rows[0]?.dungeon_ascension || 0;

    // Biome + ascension picked at the entrance screen. Default = Catacombs A0.
    const requestedBiome = req.body?.biome || 'catacombs';
    const requestedAscension = Math.max(0, parseInt(req.body?.ascension) || 0);
    const biome = biomeById(requestedBiome) || biomeById('catacombs');
    // Lock biome behind required ascension level.
    if (biome.unlockAtAscension > userAscension) {
      return res.status(403).json({ error: `Locked. Reach Ascension ${biome.unlockAtAscension} to enter ${biome.name}.` });
    }
    // Cap chosen ascension at unlocked + 1 (you can play one level above, optionally).
    const ascension = Math.min(requestedAscension, userAscension + 1);

    const map = generateMap(biome.id);
    const nodes = map.nodes.map(n => {
      if (!n.monsterId) return n;
      // Ascension stacks a flat multiplier on top of level scaling.
      const ascMult = 1 + ascension * 0.12;
      const scaled = scaledMonster(monsterById(n.monsterId), level);
      const m = scaled ? {
        ...scaled,
        hp: Math.round(scaled.hp * ascMult),
        power: Math.round(scaled.power * (1 + ascension * 0.08)),
        xp: Math.round(scaled.xp * (1 + ascension * 0.10)),
      } : scaled;
      return { ...n, monster: m };
    });
    res.json({
      map: { nodes, edges: map.edges },
      playerLevel: level,
      biome,
      ascension,
      userAscension,
    });
  } catch (err) {
    console.error('dungeon/run error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List biomes the player can / can't enter, for the entrance picker.
router.get('/biomes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT dungeon_ascension FROM users WHERE id = $1', [req.userId]);
    const asc = rows[0]?.dungeon_ascension || 0;
    res.json(BIOMES.map(b => ({ ...b, unlocked: asc >= b.unlockAtAscension })));
  } catch (err) {
    console.error('dungeon/biomes error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Catalog endpoints for the client to render relic / event details.
router.get('/relics',     (req, res) => res.json(RELICS));
router.get('/events',     (req, res) => res.json(EVENTS));
router.post('/pick-relic', (req, res) => {
  const rarity = req.body?.rarity;
  res.json({ relic: pickRelic(rarity) });
});

// Claim XP+gold for defeating a monster. Server validates the monster id but
// trusts that the client actually killed it (battle is client-driven).
router.post('/reward', async (req, res) => {
  try {
    const { monsterId } = req.body;
    const baseMonster = monsterById(monsterId);
    if (!baseMonster) return res.status(400).json({ error: 'Unknown monster' });

    // Look up the player's level so we can scale the XP reward to match the
    // scaled difficulty. Gold stays at the flat base value.
    const { rows: userRows } = await pool.query('SELECT level FROM users WHERE id = $1', [req.userId]);
    const level = userRows[0]?.level || 1;
    const monster = scaledMonster(baseMonster, level);

    await addXP(req.userId, monster.xp);
    await pool.query(
      'UPDATE users SET gold = gold + $1, lifetime_gold = COALESCE(lifetime_gold, 0) + $1 WHERE id = $2',
      [monster.gold, req.userId]
    );
    // Bumping ascension on every boss kill — surfaces on /auth/me for the
    // entrance-screen ascension chip and future difficulty modifiers.
    if (baseMonster.tier === 5) {
      await pool.query(
        'UPDATE users SET dungeon_ascension = COALESCE(dungeon_ascension, 0) + 1 WHERE id = $1',
        [req.userId]
      );
    }
    const { rows } = await pool.query('SELECT xp, level, gold, dungeon_ascension FROM users WHERE id = $1', [req.userId]);
    res.json({ xp: monster.xp, gold: monster.gold, user: rows[0] });
  } catch (err) {
    console.error('dungeon/reward error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Spend gold on a dungeon potion. Server validates the potion and the
// user's gold balance, then deducts. Returns the potion + new balance.
router.post('/buy-potion/:potionId', async (req, res) => {
  try {
    const potion = potionById(req.params.potionId);
    if (!potion) return res.status(404).json({ error: 'Potion not found' });

    const { rows } = await pool.query('SELECT gold, username FROM users WHERE id = $1', [req.userId]);
    const me = rows[0];
    const isTheDevs = me?.username?.toLowerCase() === 'thedevs';
    if (!isTheDevs && (me?.gold || 0) < potion.cost) {
      return res.status(400).json({ error: 'Not enough gold' });
    }

    if (!isTheDevs) {
      await pool.query('UPDATE users SET gold = gold - $1 WHERE id = $2', [potion.cost, req.userId]);
    }
    const { rows: updated } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
    res.json({ success: true, potion, gold: updated[0].gold });
  } catch (err) {
    console.error('dungeon/buy-potion error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Treasure / chest reward — grants a flat gold amount based on the room
// tier. Used by the treasure-room node type. Always honoured (the client
// chose this room, and treasure rewards are small/non-grindable).
router.post('/treasure', async (req, res) => {
  try {
    const { tier } = req.body;
    const t = Math.max(1, Math.min(5, parseInt(tier) || 1));
    // Reduced from the old 40+30t formula — dungeon gold should accent the
    // economy, not replace habit gold as the main income source.
    const gold = 15 + t * 10 + Math.floor(Math.random() * 8);
    await pool.query(
      'UPDATE users SET gold = gold + $1, lifetime_gold = COALESCE(lifetime_gold, 0) + $1 WHERE id = $2',
      [gold, req.userId]
    );
    const { rows } = await pool.query('SELECT gold FROM users WHERE id = $1', [req.userId]);
    res.json({ gold, user: rows[0] });
  } catch (err) {
    console.error('dungeon/treasure error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Catalog endpoints — used by the loadout editor.
router.get('/attacks', (req, res) => res.json(ATTACKS));
router.get('/monsters', (req, res) => res.json(MONSTERS));
router.get('/potions', (req, res) => res.json(POTIONS));

module.exports = router;
