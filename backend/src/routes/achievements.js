const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { ACHIEVEMENTS, byCode } = require('../data/achievements');
const { itemById } = require('../data/items');
const router = express.Router();

// Gather everything we need to evaluate achievement criteria in one shot.
async function collectStats(userId) {
  const { rows: u } = await pool.query(
    'SELECT level, lifetime_gold FROM users WHERE id = $1',
    [userId]
  );
  const user = u[0] || {};

  const { rows: h } = await pool.query(
    `SELECT
       COUNT(*)::int                                 AS habit_count,
       COALESCE(SUM(total_completions), 0)::int      AS total_completions,
       COALESCE(MAX(best_streak), 0)::int            AS best_streak
     FROM habits WHERE user_id = $1`,
    [userId]
  );

  const { rows: inv } = await pool.query(
    'SELECT item_id FROM user_inventory WHERE user_id = $1',
    [userId]
  );
  const itemsOwned = inv.length;
  const legendaryOwned = inv.some(r => itemById(r.item_id)?.rarity === 'legendary') ? 1 : 0;

  const { rows: f } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM friendships
     WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`,
    [userId]
  );

  // Perfect day: at least one day in history where all habits at the time were
  // completed. Use today's habit roster to check today and recent days — good
  // enough heuristic for the achievement.
  const { rows: pd } = await pool.query(
    `WITH today_habits AS (
       SELECT id FROM habits WHERE user_id = $1
     ),
     by_day AS (
       SELECT completed_date, COUNT(DISTINCT habit_id)::int AS done
       FROM habit_logs
       WHERE user_id = $1
         AND habit_id IN (SELECT id FROM today_habits)
       GROUP BY completed_date
     )
     SELECT COUNT(*)::int AS perfect_days FROM by_day
     WHERE done = (SELECT COUNT(*) FROM today_habits)
       AND done >= 3`,
    [userId]
  );

  return {
    level:             user.level || 1,
    lifetime_gold:     Number(user.lifetime_gold || 0),
    habit_count:       h[0].habit_count,
    total_completions: h[0].total_completions,
    best_streak:       h[0].best_streak,
    items_owned:       itemsOwned,
    legendary_owned:   legendaryOwned,
    friend_count:      f[0].c,
    perfect_day:       pd[0].perfect_days > 0 ? 1 : 0,
  };
}

// Check all achievements for a user, insert any newly earned ones, return the
// list of newly unlocked achievement objects. Safe to call repeatedly.
async function checkAchievements(userId) {
  const stats = await collectStats(userId);

  const earned = ACHIEVEMENTS
    .filter(a => (stats[a.criteria] || 0) >= a.threshold)
    .map(a => a.code);

  if (!earned.length) return [];

  // Insert all qualifying codes, skipping ones already earned. RETURNING tells
  // us which rows were actually inserted — those are the new unlocks.
  const placeholders = earned.map((_, i) => `($1, $${i + 2})`).join(', ');
  const { rows: inserted } = await pool.query(
    `INSERT INTO user_achievements (user_id, code) VALUES ${placeholders}
     ON CONFLICT DO NOTHING RETURNING code`,
    [userId, ...earned]
  );

  return inserted.map(r => byCode(r.code)).filter(Boolean);
}

router.use(auth);

// List all achievements with earned status. Also runs a check so existing
// users get backfilled the first time they visit the page after launch.
router.get('/', async (req, res) => {
  try { await checkAchievements(req.userId); } catch (e) { console.error(e); }

  const { rows } = await pool.query(
    'SELECT code, earned_at FROM user_achievements WHERE user_id = $1',
    [req.userId]
  );
  const earnedMap = new Map(rows.map(r => [r.code, r.earned_at]));

  res.json({
    achievements: ACHIEVEMENTS.map(a => ({
      ...a,
      earned: earnedMap.has(a.code),
      earned_at: earnedMap.get(a.code) || null,
    })),
    earned_count: rows.length,
    total: ACHIEVEMENTS.length,
  });
});

// Manual re-check (also runs implicitly after habit completion / item purchase)
router.post('/check', async (req, res) => {
  const newly = await checkAchievements(req.userId);
  res.json({ newly_unlocked: newly });
});

module.exports = router;
module.exports.checkAchievements = checkAchievements;
