const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'okdriver-dev-secret-change-in-production';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '8h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

function getUserFromRequest(req) {
  // Check cookie (from cookie-parser)
  const token = req.cookies?.netra_token || req.cookies?.okdriver_token;
  if (token) {
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  // Fallback: raw cookie header
  const rawCookie = req.headers && req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie.match(/(?:netra_token|okdriver_token)=([^;]+)/);
    if (match) {
      const verified = verifyToken(match[1]);
      if (verified) return verified;
    }
  }

  // Fallback: Authorization Bearer header
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  return null;
}

module.exports = {
  SECRET,
  signToken,
  verifyToken,
  getUserFromRequest,
};
