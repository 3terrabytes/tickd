const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { calcXP, levelFromXP, xpForLevel } = require('../utils/xp');
const router = express.Router();

router.use(auth);

// Get all habits for user
router.get('/', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await pool.query(`
    SELECT h.*,
      EXISTS(
        SELECT 1 FROM habit_logs l
        WHERE l.habit_id = h.id AND l.completed_date = $2
      ) AS completed_today
    FROM habits h
    WHERE h.user_id = $1
    ORDER BY h.created_at ASC
  `, [req.userId, today]);
  res.json(rows);
});

// Create habit
router.post('/', async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await pool.query(
    `INSERT INTO habits (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.userId, name, icon || '⚡', color || '#6366f1']
  );
  res.json(rows[0]);
});

// Delete habit
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Complete a habit for today
router.post('/:id/complete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  try {
    // Check not already done
    const { rows: existing } = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
      [req.params.id, today]
    );
    if (existing.length) return res.status(409).json({ error: 'Already completed today' });

    // Get habit
    const { rows: habits } = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!habits.length) return res.status(404).json({ error: 'Habit not found' });
    const habit = habits[0];

    // Check if streak continues (completed yesterday)
    const { rows: yesterday_log } = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
      [req.params.id, yesterday]
    );
    const newStreak = yesterday_log.length > 0 ? habit.streak + 1 : 1;
    const xpEarned = calcXP(newStreak);

    // Log completion
    await pool.query(
      'INSERT INTO habit_logs (habit_id, user_id, completed_date, xp_earned) VALUES ($1, $2, $3, $4)',
      [req.params.id, req.userId, today, xpEarned]
    );

    // Update habit streak
    await pool.query(
      `UPDATE habits SET streak = $1, best_streak = GREATEST(best_streak, $1), total_completions = total_completions + 1
       WHERE id = $2`,
      [newStreak, req.params.id]
    );

    // Update user XP and level
    const { rows: users } = await pool.query(
      'UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp, level',
      [xpEarned, req.userId]
    );
    const newXP = users[0].xp;
    const newLevel = levelFromXP(newXP);
    const leveledUp = newLevel > users[0].level;

    if (leveledUp) {
      await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, req.userId]);
    }

    res.json({
      xpEarned,
      newStreak,
      totalXP: newXP,
      newLevel,
      leveledUp,
      xpForNextLevel: xpForLevel(newLevel + 1)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Uncomplete a habit for today
router.delete('/:id/complete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { rows: log } = await pool.query(
    'SELECT * FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
    [req.params.id, today]
  );
  if (!log.length) return res.status(404).json({ error: 'Not completed today' });

  await pool.query('DELETE FROM habit_logs WHERE habit_id = $1 AND completed_date = $2', [req.params.id, today]);

  // Restore XP
  await pool.query('UPDATE users SET xp = GREATEST(0, xp - $1) WHERE id = $2', [log[0].xp_earned, req.userId]);

  // Recalculate streak
  const { rows: yest } = await pool.query(
    'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
    [req.params.id, yesterday]
  );
  const restoredStreak = yest.length ? await getStreakCount(req.params.id, yesterday) : 0;
  await pool.query('UPDATE habits SET streak = $1 WHERE id = $2', [restoredStreak, req.params.id]);

  res.json({ success: true });
});

async function getStreakCount(habitId, fromDate) {
  let streak = 0;
  let date = new Date(fromDate);
  while (true) {
    const d = date.toISOString().split('T')[0];
    const { rows } = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
      [habitId, d]
    );
    if (!rows.length) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

module.exports = router;
