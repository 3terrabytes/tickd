const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    // Lifetime totals
    const { rows: u } = await pool.query(
      'SELECT xp, level, gold, lifetime_gold, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    const user = u[0];

    const { rows: tot } = await pool.query(
      `SELECT
         COUNT(*)::int                    AS total_completions,
         COALESCE(SUM(xp_earned), 0)::int AS lifetime_xp_earned
       FROM habit_logs WHERE user_id = $1`,
      [req.userId]
    );

    // Habit roster + per-habit aggregates
    const { rows: habits } = await pool.query(
      `SELECT h.id, h.name, h.icon, h.color, h.streak, h.best_streak, h.total_completions,
              h.created_at,
              COUNT(l.id) FILTER (WHERE l.completed_date >= CURRENT_DATE - INTERVAL '30 days')::int AS last_30,
              COUNT(l.id) FILTER (WHERE l.completed_date >= CURRENT_DATE - INTERVAL '7 days')::int  AS last_7
       FROM habits h
       LEFT JOIN habit_logs l ON l.habit_id = h.id
       WHERE h.user_id = $1
       GROUP BY h.id
       ORDER BY h.created_at ASC`,
      [req.userId]
    );

    // Daily completion counts for last 90 days (heatmap)
    const { rows: heatmap } = await pool.query(
      `SELECT completed_date, COUNT(*)::int AS count
       FROM habit_logs
       WHERE user_id = $1
         AND completed_date >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY completed_date
       ORDER BY completed_date ASC`,
      [req.userId]
    );

    // Day-of-week distribution (0 = Sunday)
    const { rows: dow } = await pool.query(
      `SELECT EXTRACT(DOW FROM completed_date)::int AS dow, COUNT(*)::int AS count
       FROM habit_logs WHERE user_id = $1
       GROUP BY dow ORDER BY dow`,
      [req.userId]
    );
    const weekday = Array(7).fill(0);
    dow.forEach(r => { weekday[r.dow] = r.count; });

    // XP earned per day for last 30 days
    const { rows: xpDaily } = await pool.query(
      `SELECT completed_date, COALESCE(SUM(xp_earned), 0)::int AS xp
       FROM habit_logs
       WHERE user_id = $1
         AND completed_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY completed_date
       ORDER BY completed_date ASC`,
      [req.userId]
    );

    res.json({
      user: {
        level: user.level,
        xp: user.xp,
        gold: user.gold,
        lifetime_gold: Number(user.lifetime_gold || 0),
        member_since: user.created_at,
      },
      totals: {
        total_completions: tot[0].total_completions,
        lifetime_xp_earned: tot[0].lifetime_xp_earned,
        habit_count: habits.length,
        best_streak_overall: habits.reduce((m, h) => Math.max(m, h.best_streak || 0), 0),
        current_streak_total: habits.reduce((s, h) => s + (h.streak || 0), 0),
      },
      habits,
      heatmap,
      weekday,
      xp_daily: xpDaily,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
