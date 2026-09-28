const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken, getUserFromRequest } = require('../config/auth');

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.cookie('netra_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 * 1000,
      path: '/',
    });
    res.cookie('okdriver_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 * 1000,
      path: '/',
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function logout(req, res) {
  res.clearCookie('netra_token', { path: '/' });
  res.clearCookie('okdriver_token', { path: '/' });
  return res.json({ ok: true });
}

async function getMe(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.json({ user: null });
  }
  return res.json({ user });
}

module.exports = {
  login,
  logout,
  getMe,
};
