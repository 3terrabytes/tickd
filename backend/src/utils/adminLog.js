// Helper to record an admin action into the audit trail. Called from every
// state-changing admin endpoint after the operation succeeds. Failures here
// are swallowed (logged to console) so a write hiccup never blocks the
// admin action itself.
//
// `req.admin` is populated by `requirePerm` middleware. If for some reason
// it isn't, we fall back to looking up the user by req.userId.

const { pool } = require('../db');

async function logAction(req, action, targetId = null, details = null) {
  try {
    let admin = req.admin;
    if (!admin) {
      const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.userId]);
      admin = rows[0];
    }
    if (!admin) return;

    let targetUsername = null;
    if (targetId) {
      const { rows } = await pool.query('SELECT username FROM users WHERE id = $1', [targetId]);
      targetUsername = rows[0]?.username || null;
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, admin_username, action, target_id, target_username, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [admin.id, admin.username, action, targetId, targetUsername, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('logAction failed:', err);
  }
}

module.exports = { logAction };
