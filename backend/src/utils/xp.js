// XP needed to reach a given level (quadratic scaling)
const xpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

// Calculate level from total XP
const levelFromXP = (xp) => {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
};

// XP earned for completing a habit (streak bonus)
const calcXP = (streak) => {
  const base = 10;
  if (streak >= 30) return base + 25;
  if (streak >= 14) return base + 15;
  if (streak >= 7)  return base + 10;
  if (streak >= 3)  return base + 5;
  return base;
};

const LEVEL_TITLES = [
  '', 'Rookie', 'Apprentice', 'Explorer', 'Achiever', 'Challenger',
  'Warrior', 'Champion', 'Master', 'Grandmaster', 'Legend'
];

const levelTitle = (level) => LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];

// Add XP to a user and update their level if needed
const addXP = async (userId, amount) => {
  const { pool } = require('../db');
  const { rows } = await pool.query(
    'UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp, level',
    [amount, userId]
  );
  if (!rows.length) return;
  const newLevel = levelFromXP(rows[0].xp);
  if (newLevel > rows[0].level) {
    await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);
  }
};

module.exports = { xpForLevel, levelFromXP, calcXP, levelTitle, addXP };
