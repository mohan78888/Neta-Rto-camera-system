const { getUserFromRequest } = require('../config/auth');

function authenticateUser(req, res, next) {
  req.user = getUserFromRequest(req);
  next();
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Login required' });
  }
  req.user = user;
  next();
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Login required' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  };
}

module.exports = {
  authenticateUser,
  requireAuth,
  requireRole,
};
