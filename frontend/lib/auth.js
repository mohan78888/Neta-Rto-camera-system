const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'okdriver-dev-secret-change-in-production';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET, {
    expiresIn: '8h',
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

function getUserFromRequest(req) {
  const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/okdriver_token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}

module.exports = { signToken, verifyToken, getUserFromRequest, SECRET };
