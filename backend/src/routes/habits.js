const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { calcXP, levelFromXP, xpForLevel, addXP, addGold } = require('../utils/xp');
const { checkAchievements } = require('./achievements');
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
  const { name, icon, color, gold_reward } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await pool.query(
    `INSERT INTO habits (user_id, name, icon, color, gold_reward) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.userId, name, icon || '⚡', color || '#6366f1', gold_reward || 10]
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

    // Check if streak continues (completed yesterday), with streak shield fallback
    const { rows: yesterday_log } = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_date = $2',
      [req.params.id, yesterday]
    );
    let newStreak;
    if (yesterday_log.length > 0) {
      newStreak = habit.streak + 1;
    } else if (habit.streak > 0) {
      // Streak would break — check for shield
      const { rows: shieldRows } = await pool.query('SELECT streak_shield FROM users WHERE id = $1', [req.userId]);
      if (shieldRows[0]?.streak_shield) {
        await pool.query('UPDATE users SET streak_shield = false WHERE id = $1', [req.userId]);
        newStreak = habit.streak + 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
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

    // Gold earned from habit's set reward
    const goldEarned = habit.gold_reward || 10;

    // Apply rebirth multiplier transparently via the helpers. addXP also
    // handles level-up + milestone-banner grants for us.
    const xpRes   = await addXP(req.userId, xpEarned);
    const goldRes = await addGold(req.userId, goldEarned);
    const newXP    = xpRes?.xp ?? 0;
    const newLevel = xpRes?.level ?? 1;
    // We need to know if this completion crossed a level boundary so the
    // client can show the "LEVEL UP" banner. Re-derive from the returned XP.
    const oldXp = newXP - (xpRes?.granted || 0);
    const leveledUp = levelFromXP(oldXp) < newLevel;

    // Achievement check — never let a failure break habit completion
    let newAchievements = [];
    try {
      newAchievements = await checkAchievements(req.userId);
    } catch (e) {
      console.error('Achievement check failed:', e);
    }

    res.json({
      // Display the post-multiplier amounts so the floating "+XP / +Gold"
      // toast reflects rebirth bonuses.
      xpEarned:   xpRes?.granted   ?? xpEarned,
      goldEarned: goldRes?.granted ?? goldEarned,
      newStreak,
      totalXP: newXP,
      totalGold: goldRes?.gold ?? 0,
      newLevel,
      leveledUp,
      xpForNextLevel: xpForLevel(newLevel + 1),
      newAchievements,
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

  // Restore XP and gold
  const { rows: habitRow } = await pool.query('SELECT gold_reward FROM habits WHERE id = $1', [req.params.id]);
  const goldToRestore = habitRow[0]?.gold_reward || 10;
  const { rows: updatedUser } = await pool.query(
    'UPDATE users SET xp = GREATEST(0, xp - $1), gold = GREATEST(0, gold - $2) WHERE id = $3 RETURNING xp',
    [log[0].xp_earned, goldToRestore, req.userId]
  );

  // Recalculate and update level
  const { levelFromXP } = require('../utils/xp');
  const newLevel = levelFromXP(updatedUser[0].xp);
  await pool.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, req.userId]);

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
