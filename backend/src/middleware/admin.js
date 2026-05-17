// Must be mounted AFTER the auth middleware so req.isAdmin is populated.
module.exports = function adminOnly(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};
