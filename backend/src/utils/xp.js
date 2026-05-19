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

// Full L1-L100 title progression (kept in sync with frontend/src/utils/xp.js)
const LEVEL_TITLES = [
  '',
  'Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend',
  'Mythic','Ascendant','Transcendent','Eternal','Demigod','Celestial','Cosmic','Apex','Sovereign','Avatar',
  'Stargazer','Starborn','Astral Knight','Solar Sage','Lunar Lord','Comet','Pulsar','Nebula','Galaxy-Walker','Cosmonaut',
  'Chrono-Touched','Time Reaver','Era Walker','Aeon Lord','Epoch','Past-Eater','Future-Seer','Now','Forever','Outside Time',
  'Saint','Prophet','Cardinal','Hierophant','Oracle','Seraph','Cherub','Throne','Power','Dominion',
  'Constellation','Singularity','Black Hole','White Hole','Universe-Bound','Multiverse','Quantum','Wavefront','Particle','Reality Anchor',
  'Dreamwalker','Nightmare','Vision','Mirage','Echo','Shadow','Reflection','Whisper','Murmur','Forgotten',
  'Unwritten','Unspoken','Unsung','Hidden','Veiled','Sealed','Locked','Bound','Unbound','Released',
  'The Nameless','Without Form','Beyond Words','Inconceivable','The Other','Outside','Beyond','Without End','Without Beginning','Eternal Now',
  'He Who Was','She Who Will Be','The All','The One','The Many','The Source','The Sink','Penultimate','Tickd God','Tickd Incarnate',
];

const levelTitle = (level) => LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Tickd Incarnate';

// Banners awarded automatically at certain milestone levels — these items
// must exist in data/items.js with `unlockReward: true` (kept out of the shop).
const LEVEL_REWARD_BANNERS = {
  25:  'banner_veteran',
  50:  'banner_ascendant',
  100: 'banner_incarnate',
};

// Add XP to a user, level them up if needed, and grant any milestone-reward
// banners they cross. Returns nothing — the caller refetches /me to see
// the new state.
const addXP = async (userId, amount) => {
  const { pool } = require('../db');
  const { rows } = await pool.query(
    'UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp, level',
    [amount, userId]
  );
  if (!rows.length) return;
  const oldLevel = rows[0].level;
  const newLevel = levelFromXP(rows[0].xp);
  if (newLevel > oldLevel) {
    await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);

    // Check every threshold the user just crossed (level may jump multiple).
    for (const [thresholdStr, itemId] of Object.entries(LEVEL_REWARD_BANNERS)) {
      const threshold = parseInt(thresholdStr);
      if (newLevel >= threshold && oldLevel < threshold) {
        try {
          await pool.query(
            `INSERT INTO user_inventory (user_id, item_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, item_id) DO NOTHING`,
            [userId, itemId]
          );
        } catch (err) {
          console.error(`Level-reward grant failed: L${threshold} → ${itemId}`, err);
        }
      }
    }
  }
};

module.exports = { xpForLevel, levelFromXP, calcXP, levelTitle, addXP, LEVEL_REWARD_BANNERS };
