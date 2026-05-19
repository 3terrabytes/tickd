const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { addXP } = require('../utils/xp');
const { itemById, weaponClassOf } = require('../data/items');
const { starterDeck, attackById } = require('../data/attacks');

const router = express.Router();
router.use(auth);

// Minimum hours between two specific players' duels — stops mutual XP-grind.
const COOLDOWN_HOURS = 6;

// Both players must be mutual friends — mirrors the gifts.js pattern.
async function assertFriends(a, b) {
  const { rows } = await pool.query(
    `SELECT 1 FROM friendships WHERE status = 'accepted' AND
     ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [a, b]
  );
  return rows.length > 0;
}

// Build a player's combat stats from their gear + level. Used for both sides.
async function buildCombatant(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.level,
            u.avatar_skin, u.avatar_hair, u.avatar_eyes, u.avatar_hair_style, u.avatar_gender, u.avatar_beard
     FROM users u WHERE u.id = $1`,
    [userId]
  );
  const u = rows[0];
  if (!u) return null;

  const { rows: eq } = await pool.query('SELECT * FROM user_equipped WHERE user_id = $1', [userId]);
  const equippedRow = eq[0] || {};
  const equipped = {};
  for (const slot of ['weapon', 'armor', 'banner', 'badge', 'companion', 'title']) {
    equipped[slot] = equippedRow[slot] ? itemById(equippedRow[slot]) : null;
  }

  // Magic = sum of equipped magic, drives damage bonus
  const magic = ['weapon', 'armor', 'badge', 'companion']
    .map(s => equipped[s]?.magic || 0)
    .reduce((a, b) => a + b, 0);
  const armor = equipped.armor?.magic || 0;
  const weaponClass = weaponClassOf(equipped.weapon);

  return {
    id: u.id,
    username: u.username,
    level: u.level,
    appearance: u,
    equipped,
    magic,
    armor,
    weaponClass,
    hp: 100 + 20 * u.level,
    maxHp: 100 + 20 * u.level,
    deck: starterDeck(weaponClass).map(id => attackById(id)).filter(Boolean),
  };
}

// Deterministic simulation. Each round: both sides play their highest-value
// card simultaneously; damage applies after block. First to 0 HP loses.
// Capped at 30 rounds so a stalemate just ends.
function simulate(a, b) {
  const log = [];
  for (let round = 1; round <= 30; round++) {
    const aCard = pickAiCard(a);
    const bCard = pickAiCard(b);
    const aBlockBefore = a.block || 0;
    const bBlockBefore = b.block || 0;

    // Apply block first
    a.block = aCard.block ? (a.block || 0) + aCard.block : 0;
    b.block = bCard.block ? (b.block || 0) + bCard.block : 0;

    // Damage simultaneous, accounting for armor mitigation
    const dmgToB = Math.max(0, (aCard.power || 0) + Math.floor((a.magic || 0) / 4) - Math.max(0, b.block - (aCard.power || 0)) - Math.floor((b.armor || 0) / 2));
    const dmgToA = Math.max(0, (bCard.power || 0) + Math.floor((b.magic || 0) / 4) - Math.max(0, a.block - (bCard.power || 0)) - Math.floor((a.armor || 0) / 2));

    // Heals apply
    if (aCard.tag === 'heal') a.hp = Math.min(a.maxHp, a.hp + (aCard.heal || 25));
    if (bCard.tag === 'heal') b.hp = Math.min(b.maxHp, b.hp + (bCard.heal || 25));

    b.hp = Math.max(0, b.hp - dmgToB);
    a.hp = Math.max(0, a.hp - dmgToA);

    log.push({
      round,
      a: { card: aCard.name, hp: a.hp, dealt: dmgToB },
      b: { card: bCard.name, hp: b.hp, dealt: dmgToA },
    });

    if (a.hp <= 0 || b.hp <= 0) break;
  }
  const winner = a.hp <= 0 && b.hp <= 0 ? (a.hp >= b.hp ? a : b)
              : a.hp <= 0 ? b
              : b.hp <= 0 ? a
              : (a.hp >= b.hp ? a : b);
  return { log, winner };
}

// AI card pick — go heavy when opponent is at <40% HP, defend when you're at
// <30% HP, otherwise the highest-power card you have.
function pickAiCard(self) {
  const deck = self.deck;
  if (!deck.length) return { name: 'Whiff', power: 0, block: 0 };
  // Heuristic
  if (self.hp / self.maxHp < 0.3) {
    const block = deck.find(c => c.block) || deck.find(c => c.tag === 'heal');
    if (block) return block;
  }
  return deck.reduce((best, c) => ((c.power || 0) > (best.power || 0) ? c : best), deck[0]);
}

// Challenge a friend to an async duel. Returns the full result + log so the
// challenger's UI can play out the animation in their dungeon view.
router.post('/challenge/:friendId', async (req, res) => {
  try {
    const opponentId = parseInt(req.params.friendId);
    if (opponentId === req.userId) return res.status(400).json({ error: "Can't duel yourself" });

    if (!(await assertFriends(req.userId, opponentId))) {
      return res.status(403).json({ error: 'Friends only' });
    }

    // Cooldown — most recent duel between this pair must be older than COOLDOWN_HOURS.
    const { rows: recent } = await pool.query(
      `SELECT created_at FROM duels
       WHERE ((challenger_id = $1 AND opponent_id = $2) OR (challenger_id = $2 AND opponent_id = $1))
       ORDER BY created_at DESC LIMIT 1`,
      [req.userId, opponentId]
    );
    if (recent[0]) {
      const ageHours = (Date.now() - new Date(recent[0].created_at).getTime()) / 3_600_000;
      if (ageHours < COOLDOWN_HOURS) {
        const remaining = (COOLDOWN_HOURS - ageHours);
        return res.status(429).json({ error: `Cooldown — try again in ${remaining.toFixed(1)}h.` });
      }
    }

    const a = await buildCombatant(req.userId);
    const b = await buildCombatant(opponentId);
    if (!a || !b) return res.status(404).json({ error: 'Combatant not found' });

    const { log, winner } = simulate({ ...a }, { ...b });
    const challengerWon = winner.id === a.id;

    // XP per the user's spec: 30 + opponent.level*5 for winner, 5 consolation.
    const winnerOpponentLevel = challengerWon ? b.level : a.level;
    const winnerXp = 30 + winnerOpponentLevel * 5;
    const loserXp = 5;
    const challengerXp = challengerWon ? winnerXp : loserXp;
    const opponentXp = challengerWon ? loserXp : winnerXp;

    await addXP(req.userId,  challengerXp);
    await addXP(opponentId,  opponentXp);

    await pool.query(
      `INSERT INTO duels (challenger_id, opponent_id, winner_id, challenger_xp, opponent_xp, log)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, opponentId, winner.id, challengerXp, opponentXp, JSON.stringify(log)]
    );

    res.json({
      challenger: { id: a.id, username: a.username, level: a.level, finalHp: a.hp, maxHp: a.maxHp },
      opponent:   { id: b.id, username: b.username, level: b.level, finalHp: b.hp, maxHp: b.maxHp },
      winnerId: winner.id,
      challengerWon,
      challengerXp,
      opponentXp,
      log,
    });
  } catch (err) {
    console.error('duels/challenge error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*,
              c.username AS challenger_name,
              o.username AS opponent_name
       FROM duels d
       JOIN users c ON c.id = d.challenger_id
       JOIN users o ON o.id = d.opponent_id
       WHERE d.challenger_id = $1 OR d.opponent_id = $1
       ORDER BY d.created_at DESC LIMIT 20`,
      [req.userId]
    );
    res.json(rows.map(r => ({
      ...r,
      youWon: r.winner_id === req.userId,
      youAreChallenger: r.challenger_id === req.userId,
    })));
  } catch (err) {
    console.error('duels/history error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
