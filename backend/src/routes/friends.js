const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { levelTitle, xpForLevel } = require('../utils/xp');
const router = express.Router();

router.use(auth);

// Search users
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const { rows } = await pool.query(
    `SELECT id, username, level, avatar_color FROM users
     WHERE username ILIKE $1 AND id != $2 LIMIT 10`,
    [`%${q}%`, req.userId]
  );
  res.json(rows);
});

// Send friend request
router.post('/request/:targetId', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)',
      [req.userId, req.params.targetId]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Request already sent' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:requesterId', async (req, res) => {
  await pool.query(
    `UPDATE friendships SET status = 'accepted'
     WHERE requester_id = $1 AND addressee_id = $2`,
    [req.params.requesterId, req.userId]
  );
  res.json({ success: true });
});

// Decline / remove friend
router.delete('/:otherId', async (req, res) => {
  await pool.query(
    `DELETE FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [req.userId, req.params.otherId]
  );
  res.json({ success: true });
});

// Get pending requests
router.get('/pending', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.level, u.avatar_color, f.created_at
    FROM friendships f
    JOIN users u ON u.id = f.requester_id
    WHERE f.addressee_id = $1 AND f.status = 'pending'
  `, [req.userId]);
  res.json(rows);
});

// Get friends + leaderboard
router.get('/', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.xp, u.level, u.avatar_color,
      (SELECT COUNT(*) FROM habit_logs l WHERE l.user_id = u.id AND l.completed_date = $2) AS completed_today,
      (SELECT COUNT(*) FROM habits h WHERE h.user_id = u.id) AS total_habits,
      (SELECT MAX(h.streak) FROM habits h WHERE h.user_id = u.id) AS best_streak
    FROM users u
    JOIN friendships f ON
      (f.requester_id = $1 AND f.addressee_id = u.id AND f.status = 'accepted') OR
      (f.addressee_id = $1 AND f.requester_id = u.id AND f.status = 'accepted')
    WHERE u.id != $1
    ORDER BY u.xp DESC
  `, [req.userId, today]);

  const enriched = rows.map(r => ({
    ...r,
    levelTitle: levelTitle(r.level),
    xpForNextLevel: xpForLevel(r.level + 1)
  }));

  res.json(enriched);
});

module.exports = router;
