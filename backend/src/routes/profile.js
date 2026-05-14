const express = require('express');
const { pool } = require('../db');
const router = express.Router();
const { itemById } = require('../data/items');

// Helper to check if viewer can see a field based on privacy + friendship
const canSee = (privacy, isSelf, isFriend) => {
  if (isSelf) return true;
  if (privacy === 'all') return true;
  if (privacy === 'friends' && isFriend) return true;
  return false;
};

// Public inventory (for trade picker) — only friends can see
router.get('/:username/inventory', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let viewerId = null;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      viewerId = jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch {}
  }

  const { rows: userRows } = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [req.params.username]);
  if (!userRows.length) return res.status(404).json({ error: 'Not found' });
  const targetId = userRows[0].id;

  if (!viewerId) return res.status(403).json({ error: 'Login required' });

  const { rows: fr } = await pool.query(
    `SELECT id FROM friendships WHERE status='accepted' AND
     ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))`,
    [viewerId, targetId]
  );
  if (!fr.length && viewerId !== targetId) return res.status(403).json({ error: 'Friends only' });

  const { rows: inv } = await pool.query('SELECT item_id FROM user_inventory WHERE user_id=$1', [targetId]);
  res.json(inv.map(r => itemById(r.item_id)).filter(Boolean));
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;

  // Get auth token if provided (optional)
  let viewerId = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      viewerId = decoded.userId;
    } catch {}
  }

  // Get profile user
  const { rows: userRows } = await pool.query(
    `SELECT id, username, xp, level, avatar_color, avatar_skin, avatar_hair, avatar_eyes,
            avatar_hair_style, avatar_beard, privacy_xp, privacy_streaks, privacy_habits,
            created_at
     FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );
  if (!userRows.length) return res.status(404).json({ error: 'User not found' });
  const u = userRows[0];

  // Check friendship
  let isFriend = false;
  if (viewerId && viewerId !== u.id) {
    const { rows: fr } = await pool.query(
      `SELECT id FROM friendships WHERE status = 'accepted' AND
       ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
      [viewerId, u.id]
    );
    isFriend = fr.length > 0;
  }
  const isSelf = viewerId === u.id;

  // Get equipped items
  const { rows: eqRows } = await pool.query('SELECT * FROM user_equipped WHERE user_id = $1', [u.id]);
  const eq = eqRows[0] || {};
  const equipped = {
    weapon: eq.weapon ? itemById(eq.weapon) : null,
    armor:  eq.armor  ? itemById(eq.armor)  : null,
    banner: eq.banner ? itemById(eq.banner) : null,
    badge:  eq.badge  ? itemById(eq.badge)  : null,
  };

  // Habits (privacy controlled)
  let habits = [];
  if (canSee(u.privacy_habits, isSelf, isFriend)) {
    const { rows } = await pool.query(
      `SELECT id, name, icon, color, streak, best_streak, total_completions, created_at
       FROM habits WHERE user_id = $1 ORDER BY streak DESC`,
      [u.id]
    );
    habits = rows;
  }

  // Habit completion heatmap (last 90 days) — only if habits visible
  let heatmap = [];
  if (canSee(u.privacy_habits, isSelf, isFriend) && habits.length) {
    const { rows } = await pool.query(
      `SELECT completed_date, COUNT(*) AS count
       FROM habit_logs
       WHERE user_id = $1 AND completed_date >= NOW() - INTERVAL '90 days'
       GROUP BY completed_date ORDER BY completed_date ASC`,
      [u.id]
    );
    heatmap = rows;
  }

  // Best streak across all habits
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.best_streak || 0), 0);

  // Completed days for streak calendar (last 28 days)
  let completedDays = [];
  if (canSee(u.privacy_habits, isSelf, isFriend)) {
    const { rows: cdRows } = await pool.query(
      `SELECT DISTINCT completed_date::text AS day
       FROM habit_logs
       WHERE user_id = $1 AND completed_date >= NOW() - INTERVAL '28 days'
       ORDER BY day ASC`,
      [u.id]
    );
    completedDays = cdRows.map(r => r.day);
  }

  res.json({
    id: u.id,
    username: u.username,
    level: u.level,
    xp: canSee(u.privacy_xp, isSelf, isFriend) ? u.xp : null,
    avatar_skin:       u.avatar_skin,
    avatar_hair:       u.avatar_hair,
    avatar_eyes:       u.avatar_eyes,
    avatar_hair_style: u.avatar_hair_style,
    avatar_beard:      u.avatar_beard,
    equipped,
    habits:      canSee(u.privacy_habits, isSelf, isFriend) ? habits : [],
    heatmap:     canSee(u.privacy_habits, isSelf, isFriend) ? heatmap : [],
    completed_days: canSee(u.privacy_habits, isSelf, isFriend) ? completedDays : [],
    best_streak: canSee(u.privacy_streaks, isSelf, isFriend) ? bestStreak : null,
    member_since: u.created_at,
    isFriend,
    isSelf,
  });
});

module.exports = router;
