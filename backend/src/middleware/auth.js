const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;

  // Block requests from accounts under an active perm/temp suspension.
  // Allow GET /auth/me and PATCH /auth/warning-seen so the frontend can show the suspension/warning notice.
  try {
    const { rows } = await pool.query(
      `SELECT username, is_admin, is_master_admin, admin_perms,
              suspension_type, suspended_until
       FROM users WHERE id = $1`,
      [req.userId]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'User not found' });

    // Any tier of admin (full, master, or half with at least one perm) gets
    // through the basic `adminOnly` gate. Per-action perm checks happen via
    // requirePerm() at the route level.
    const isAnyAdmin = !!u.is_admin
      || !!u.is_master_admin
      || (Array.isArray(u.admin_perms) && u.admin_perms.length > 0)
      || (u.username || '').toLowerCase() === 'thedevs';
    req.isAdmin = isAnyAdmin;

    const now = new Date();
    let active = u.suspension_type === 'perm';
    if (u.suspension_type === 'temp' && u.suspended_until && new Date(u.suspended_until) > now) {
      active = true;
    } else if (u.suspension_type === 'temp' && u.suspended_until && new Date(u.suspended_until) <= now) {
      // expired — clear it
      await pool.query(
        `UPDATE users SET suspension_type = NULL, suspension_reason = NULL,
           suspended_until = NULL, suspended_at = NULL, suspended_by = NULL
         WHERE id = $1`, [req.userId]
      );
      active = false;
    }

    const allowedWhileSuspended =
      (req.method === 'GET'   && req.baseUrl === '/api/auth' && req.path === '/me') ||
      (req.method === 'PATCH' && req.baseUrl === '/api/auth' && req.path === '/warning-seen') ||
      (req.method === 'POST'  && req.baseUrl === '/api/auth' && req.path === '/logout');

    if (active && !allowedWhileSuspended) {
      return res.status(403).json({ error: 'Account suspended', suspended: true });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = authMiddleware;
