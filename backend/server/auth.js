import crypto from 'node:crypto';

const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_ADMIN_TOKEN = 'sajedar-dev-admin-token';

export function getAdminConfig() {
  return {
    username: process.env.ADMIN_USER || DEFAULT_ADMIN_USER,
    password: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    token: process.env.ADMIN_TOKEN || DEFAULT_ADMIN_TOKEN
  };
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function loginHandler(req, res) {
  const { username, password } = req.body || {};
  const config = getAdminConfig();

  if (
    timingSafeEqualString(username || '', config.username) &&
    timingSafeEqualString(password || '', config.password)
  ) {
    return res.json({
      token: config.token,
      user: {
        username: config.username
      }
    });
  }

  return res.status(401).json({ message: 'Invalid credentials.' });
}

export function requireAdmin(req, res, next) {
  const config = getAdminConfig();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  if (token && timingSafeEqualString(token, config.token)) {
    return next();
  }

  return res.status(401).json({ message: 'Newsroom access required.' });
}
