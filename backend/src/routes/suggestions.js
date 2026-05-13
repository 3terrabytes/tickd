const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Submit a suggestion
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });

  const { rows: user } = await pool.query('SELECT username FROM users WHERE id = $1', [req.userId]);

  const { rows } = await pool.query(
    'INSERT INTO suggestions (user_id, username, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.userId, user[0]?.username, title.trim(), description?.trim() || null]
  );
  res.json(rows[0]);
});

// Get all suggestions sorted by votes
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.*,
      EXISTS(SELECT 1 FROM suggestion_votes v WHERE v.user_id = $1 AND v.suggestion_id = s.id) AS voted
    FROM suggestions s
    ORDER BY s.votes DESC, s.created_at DESC
    LIMIT 50
  `, [req.userId]);
  res.json(rows);
});

// Upvote a suggestion
router.post('/:id/vote', async (req, res) => {
  try {
    await pool.query('INSERT INTO suggestion_votes (user_id, suggestion_id) VALUES ($1, $2)', [req.userId, req.params.id]);
    await pool.query('UPDATE suggestions SET votes = votes + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already voted' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove vote
router.delete('/:id/vote', async (req, res) => {
  await pool.query('DELETE FROM suggestion_votes WHERE user_id = $1 AND suggestion_id = $2', [req.userId, req.params.id]);
  await pool.query('UPDATE suggestions SET votes = GREATEST(0, votes - 1) WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
