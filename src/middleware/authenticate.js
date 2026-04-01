const jwt = require('jsonwebtoken');
const db = require('../db/client');
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { getPermissionsForRole } = require('../utils/permissions');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required.');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await db.get('SELECT id, name, email, role, status, archived_at FROM users WHERE id = ?', [
      payload.sub,
    ]);

    if (!user) {
      throw new AppError(401, 'User for the provided token no longer exists.');
    }

    if (user.archived_at) {
      throw new AppError(403, 'User account has been archived.');
    }

    if (user.status !== 'active') {
      throw new AppError(403, 'User account is inactive.');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: getPermissionsForRole(user.role),
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Invalid or expired authentication token.'));
    }

    next(error);
  }
}

module.exports = {
  authenticate,
};
