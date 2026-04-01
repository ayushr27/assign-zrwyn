const bcrypt = require('bcryptjs');
const db = require('../../db/client');
const { AppError } = require('../../utils/errors');
const { buildPagination } = require('../../utils/pagination');
const { toPublicUser } = require('./users.presenter');

async function assertEmailAvailable(email, excludeUserId) {
  const existing = excludeUserId
    ? await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, excludeUserId])
    : await db.get('SELECT id FROM users WHERE email = ?', [email]);

  if (existing) {
    throw new AppError(409, 'A user with this email already exists.');
  }
}

async function getUserRowById(userId) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  return user;
}

function buildUserWhereClause(filters) {
  const clauses = [];
  const params = [];

  if (!filters.includeArchived) {
    clauses.push('archived_at IS NULL');
  }

  if (filters.role) {
    clauses.push('role = ?');
    params.push(filters.role);
  }

  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    const pattern = `%${filters.search.toLowerCase()}%`;
    clauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)');
    params.push(pattern, pattern);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

async function ensureAdminSafety(targetUser, payload, actor) {
  const nextRole = payload.role || targetUser.role;
  const nextStatus = payload.status || targetUser.status;
  const removesActiveAdmin =
    targetUser.role === 'admin' &&
    targetUser.status === 'active' &&
    (nextRole !== 'admin' || nextStatus !== 'active');

  if (!removesActiveAdmin) {
    return;
  }

  if (actor.id === targetUser.id) {
    throw new AppError(400, 'You cannot remove or deactivate your own admin access.');
  }

  const row = await db.get(
    'SELECT COUNT(*) AS count FROM users WHERE role = ? AND status = ? AND id != ?',
    ['admin', 'active', targetUser.id]
  );

  if (Number(row.count) === 0) {
    throw new AppError(400, 'At least one active admin user must remain.');
  }
}

async function listUsers(filters) {
  const { whereClause, params } = buildUserWhereClause(filters);
  const totalRow = await db.get(`SELECT COUNT(*) AS count FROM users ${whereClause}`, params);
  const totalItems = Number(totalRow.count);
  const offset = (filters.page - 1) * filters.pageSize;
  const rows = await db.all(
    `
      SELECT *
      FROM users
      ${whereClause}
      ORDER BY CASE WHEN archived_at IS NULL THEN 0 ELSE 1 END ASC, created_at ASC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pageSize, offset]
  );

  return {
    data: rows.map(toPublicUser),
    meta: buildPagination(filters.page, filters.pageSize, totalItems),
  };
}

async function getUserById(userId) {
  const user = await getUserRowById(userId);
  return toPublicUser(user);
}

async function createUser(payload) {
  const email = payload.email.toLowerCase();
  await assertEmailAvailable(email);

  const timestamp = new Date().toISOString();
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const inserted = await db.run(
    `
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [payload.name, email, passwordHash, payload.role, payload.status, timestamp, timestamp]
  );
  const userId = Number(inserted.lastInsertRowid);

  return getUserById(userId);
}

async function updateUser(userId, payload, actor) {
  const existingUser = await getUserRowById(userId);
  const email = payload.email ? payload.email.toLowerCase() : existingUser.email;

  if (payload.email) {
    await assertEmailAvailable(email, userId);
  }

  await ensureAdminSafety(existingUser, payload, actor);

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) {
    updatePayload.name = payload.name;
  }

  if (payload.email !== undefined) {
    updatePayload.email = email;
  }

  if (payload.role !== undefined) {
    updatePayload.role = payload.role;
  }

  if (payload.status !== undefined) {
    updatePayload.status = payload.status;
  }

  if (payload.password !== undefined) {
    updatePayload.password_hash = await bcrypt.hash(payload.password, 10);
  }

  const entries = Object.entries(updatePayload);
  const assignments = entries.map(([column]) => `${column} = ?`).join(', ');

  await db.run(
    `UPDATE users SET ${assignments} WHERE id = ?`,
    [...entries.map(([, value]) => value), userId]
  );

  return getUserById(userId);
}

async function archiveUser(userId, actor) {
  const existingUser = await getUserRowById(userId);

  if (existingUser.archived_at) {
    throw new AppError(409, 'User is already archived.');
  }

  await ensureAdminSafety(existingUser, { status: 'inactive' }, actor);

  if (actor.id === existingUser.id) {
    throw new AppError(400, 'You cannot archive your own account.');
  }

  const timestamp = new Date().toISOString();

  await db.run(
    `
      UPDATE users
      SET status = ?, archived_at = ?, archived_by = ?, updated_at = ?
      WHERE id = ?
    `,
    ['inactive', timestamp, actor.id, timestamp, userId]
  );
}

async function restoreUser(userId, actor) {
  const existingUser = await getUserRowById(userId);

  if (!existingUser.archived_at) {
    throw new AppError(409, 'User is not archived.');
  }

  if (actor.id === existingUser.id) {
    throw new AppError(400, 'You cannot restore your own account through this flow.');
  }

  const timestamp = new Date().toISOString();

  await db.run(
    `
      UPDATE users
      SET archived_at = NULL, archived_by = NULL, updated_at = ?
      WHERE id = ?
    `,
    [timestamp, userId]
  );

  return getUserById(userId);
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  archiveUser,
  restoreUser,
};
