// Granular admin permissions. A half-admin has `is_admin = false` but a
// non-null `admin_perms` array — they get the Admin panel link in the UI
// and can only hit the endpoints matching their listed perms.
//
// Tiers:
//   master admin    — `is_master_admin = true`  → all perms + manage other admins + view logs
//   full admin      — `is_admin = true`         → all perms (legacy)
//   half admin      — `is_admin = false` + perms array → only those perms
//   regular user    — none of the above
//
// All four tiers go through the same /api/admin endpoints; each one declares
// which perm it requires.

const ADMIN_PERMS = {
  manage_users:       { label: '👤 Manage Users',        desc: 'Edit XP, gold, and level' },
  grant_items:        { label: '🎁 Grant Items',         desc: 'Give or remove items from any inventory' },
  equip_users:        { label: '⚔️ Equip Items',         desc: "Equip / unequip items on a user's avatar" },
  suspend_users:      { label: '⛔ Suspend Users',       desc: 'Warn, suspend, or ban accounts' },
  manage_admins:      { label: '🛡 Manage Admins',       desc: 'Promote, demote, or change half-admin perms (master only)' },
  manage_suggestions: { label: '💡 Manage Suggestions',  desc: 'Change suggestion status or delete them' },
  view_logs:          { label: '📜 View Logs',           desc: 'Read the admin action audit log' },
};

const ALL_PERMS = Object.keys(ADMIN_PERMS);

// Does this user have the given perm? Master & full admins always pass.
function hasPerm(user, perm) {
  if (!user) return false;
  if (user.is_master_admin) return true;
  if (user.is_admin) return true;
  if (Array.isArray(user.admin_perms) && user.admin_perms.includes(perm)) return true;
  return false;
}

// Is the user any flavor of admin? Used to gate the Admin tab itself.
function isAnyAdmin(user) {
  if (!user) return false;
  if (user.is_master_admin) return true;
  if (user.is_admin) return true;
  return Array.isArray(user.admin_perms) && user.admin_perms.length > 0;
}

// Middleware factory: require a specific perm on the route.
// Assumes the user has already passed the base auth middleware (req.userId set).
function requirePerm(perm) {
  return async (req, res, next) => {
    try {
      const { pool } = require('../db');
      const { rows } = await pool.query(
        'SELECT id, username, is_admin, is_master_admin, admin_perms FROM users WHERE id = $1',
        [req.userId]
      );
      const u = rows[0];
      if (!u) return res.status(401).json({ error: 'Not found' });
      // Stash the admin identity for later log calls.
      req.admin = u;
      // theDevs username is also implicit master, in case the flag wasn't set yet.
      const isMaster = !!u.is_master_admin || (u.username || '').toLowerCase() === 'thedevs';
      if (isMaster) return next();
      if (u.is_admin) return next();
      if (Array.isArray(u.admin_perms) && u.admin_perms.includes(perm)) return next();
      return res.status(403).json({ error: `Missing permission: ${perm}` });
    } catch (err) {
      console.error('requirePerm error', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = { ADMIN_PERMS, ALL_PERMS, hasPerm, isAnyAdmin, requirePerm };
