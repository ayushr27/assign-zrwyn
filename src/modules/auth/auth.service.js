const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const db = require('../../db/knex');
const { AppError } = require('../../utils/errors');
const { toPublicUser } = require('../users/users.presenter');

async function login(credentials) {
  const email = credentials.email.toLowerCase();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (user.archived_at) {
    throw new AppError(403, 'User account has been archived.');
  }

  if (user.status !== 'active') {
    throw new AppError(403, 'User account is inactive.');
  }

  const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const timestamp = new Date().toISOString();
  await db.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [
    timestamp,
    timestamp,
    user.id,
  ]);

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: '8h',
    }
  );

  return {
    token,
    user: toPublicUser({
      ...user,
      last_login_at: timestamp,
      updated_at: timestamp,
    }),
  };
}

async function getAuthenticatedProfile(userId) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  return toPublicUser(user);
}

module.exports = {
  login,
  getAuthenticatedProfile,
};
