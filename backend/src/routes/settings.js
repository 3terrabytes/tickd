const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

const VALID_PRIVACY = ['all', 'friends', 'private'];
const VALID_THEMES  = ['default', 'midnight', 'forest', 'rose', 'ocean', 'sunset', 'mono'];

// Get settings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT privacy_xp, privacy_streaks, privacy_habits,
              notif_enabled, notif_time, theme, update_seen
       FROM users WHERE id = $1`,
      [req.userId]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error('Settings GET error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Save settings
router.post('/', async (req, res) => {
  try {
    const { privacy_xp, privacy_streaks, privacy_habits, notif_enabled, notif_time, theme, update_seen } = req.body;

    if (privacy_xp      && !VALID_PRIVACY.includes(privacy_xp))      return res.status(400).json({ error: 'Invalid privacy_xp' });
    if (privacy_streaks && !VALID_PRIVACY.includes(privacy_streaks))  return res.status(400).json({ error: 'Invalid privacy_streaks' });
    if (privacy_habits  && !VALID_PRIVACY.includes(privacy_habits))   return res.status(400).json({ error: 'Invalid privacy_habits' });
    if (theme           && !VALID_THEMES.includes(theme))             return res.status(400).json({ error: 'Invalid theme' });

    await pool.query(
      `UPDATE users SET
        privacy_xp      = COALESCE($1, privacy_xp),
        privacy_streaks = COALESCE($2, privacy_streaks),
        privacy_habits  = COALESCE($3, privacy_habits),
        notif_enabled   = COALESCE($4, notif_enabled),
        notif_time      = COALESCE($5, notif_time),
        theme           = COALESCE($6, theme),
        update_seen     = COALESCE($7, update_seen)
       WHERE id = $8`,
      [privacy_xp, privacy_streaks, privacy_habits, notif_enabled, notif_time, theme, update_seen, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Settings POST error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;
