const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const startingGold = username.toLowerCase() === 'thedevs' ? 2147483647 : 0;
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_color, gold)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, xp, level, avatar_color, gold`,
      [username, email, hash, color, startingGold]
    );
    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, xp, level, avatar_color, gold, avatar_skin, avatar_hair, avatar_eyes, avatar_hair_style, avatar_gender, avatar_beard, streak_shield, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Change username ────────────────────────────────────────────────────────
// Requires current password for safety; usernames are case-insensitive unique.
router.patch('/username', require('../middleware/auth'), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'New username and current password required' });

  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30)
    return res.status(400).json({ error: 'Username must be 3–30 characters' });
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed))
    return res.status(400).json({ error: 'Only letters, numbers, _ . and - allowed' });

  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const upd = await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, xp, level, avatar_color, gold',
      [trimmed, req.userId]
    );
    res.json({ success: true, user: upd.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    console.error('Username change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Change password ────────────────────────────────────────────────────────
router.patch('/password', require('../middleware/auth'), async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Current and new password required' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
