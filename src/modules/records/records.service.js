const db = require('../../db/knex');
const { amountToCents } = require('../../utils/amounts');
const { AppError } = require('../../utils/errors');
const { buildPagination } = require('../../utils/pagination');
const { toRecord } = require('./records.presenter');

const SORT_COLUMN_MAP = {
  occurredOn: 'fr.occurred_on',
  amount: 'fr.amount_cents',
  category: 'fr.category',
  createdAt: 'fr.created_at',
  updatedAt: 'fr.updated_at',
};

function buildRecordWhereClause(filters, alias = 'fr') {
  const clauses = [`${alias}.deleted_at IS NULL`];
  const params = [];

  if (filters.type) {
    clauses.push(`${alias}.type = ?`);
    params.push(filters.type);
  }

  if (filters.category) {
    clauses.push(`LOWER(${alias}.category) = ?`);
    params.push(filters.category.toLowerCase());
  }

  if (filters.startDate) {
    clauses.push(`${alias}.occurred_on >= ?`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push(`${alias}.occurred_on <= ?`);
    params.push(filters.endDate);
  }

  if (filters.minAmount !== undefined) {
    clauses.push(`${alias}.amount_cents >= ?`);
    params.push(amountToCents(filters.minAmount));
  }

  if (filters.maxAmount !== undefined) {
    clauses.push(`${alias}.amount_cents <= ?`);
    params.push(amountToCents(filters.maxAmount));
  }

  if (filters.search) {
    const pattern = `%${filters.search.toLowerCase()}%`;
    clauses.push(`(LOWER(${alias}.category) LIKE ? OR LOWER(COALESCE(${alias}.notes, '')) LIKE ?)`);
    params.push(pattern, pattern);
  }

  return {
    whereClause: `WHERE ${clauses.join(' AND ')}`,
    params,
  };
}

async function fetchRecordRowById(recordId, options = {}) {
  const whereConditions = ['fr.id = ?'];
  const params = [recordId];

  if (!options.includeDeleted) {
    whereConditions.push('fr.deleted_at IS NULL');
  }

  return db.get(
    `
      SELECT
        fr.id,
        fr.amount_cents,
        fr.type,
        fr.category,
        fr.occurred_on,
        fr.notes,
        fr.created_at,
        fr.updated_at,
        fr.deleted_at,
        fr.created_by,
        fr.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM financial_records fr
      LEFT JOIN users creator ON creator.id = fr.created_by
      LEFT JOIN users updater ON updater.id = fr.updated_by
      WHERE ${whereConditions.join(' AND ')}
    `,
    params
  );
}

function normalizeNotes(notes) {
  if (notes === undefined) {
    return undefined;
  }

  if (notes === null || notes === '') {
    return null;
  }

  return notes;
}

async function getRecordById(recordId) {
  const row = await fetchRecordRowById(recordId);

  if (!row) {
    throw new AppError(404, 'Record not found.');
  }

  return toRecord(row);
}

async function listRecords(filters) {
  const { whereClause, params } = buildRecordWhereClause(filters);
  const totalRow = await db.get(`SELECT COUNT(*) AS count FROM financial_records fr ${whereClause}`, params);
  const totalItems = Number(totalRow.count);
  const offset = (filters.page - 1) * filters.pageSize;
  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.occurredOn;
  const rows = await db.all(
    `
      SELECT
        fr.id,
        fr.amount_cents,
        fr.type,
        fr.category,
        fr.occurred_on,
        fr.notes,
        fr.created_at,
        fr.updated_at,
        fr.created_by,
        fr.updated_by,
        creator.name AS created_by_name,
        updater.name AS updated_by_name
      FROM financial_records fr
      LEFT JOIN users creator ON creator.id = fr.created_by
      LEFT JOIN users updater ON updater.id = fr.updated_by
      ${whereClause}
      ORDER BY ${sortColumn} ${filters.sortOrder.toUpperCase()}, fr.id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, filters.pageSize, offset]
  );

  return {
    data: rows.map(toRecord),
    meta: {
      ...buildPagination(filters.page, filters.pageSize, totalItems),
      filters: {
        type: filters.type || null,
        category: filters.category || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        minAmount: filters.minAmount ?? null,
        maxAmount: filters.maxAmount ?? null,
        search: filters.search || null,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    },
  };
}

async function createRecord(payload, actor) {
  const timestamp = new Date().toISOString();
  const inserted = await db.run(
    `
      INSERT INTO financial_records (
        amount_cents,
        type,
        category,
        occurred_on,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      amountToCents(payload.amount),
      payload.type,
      payload.category,
      payload.occurredOn,
      normalizeNotes(payload.notes),
      actor.id,
      actor.id,
      timestamp,
      timestamp,
    ]
  );
  const recordId = Number(inserted.lastInsertRowid);

  return getRecordById(recordId);
}

async function updateRecord(recordId, payload, actor) {
  await getRecordById(recordId);

  const updatePayload = {
    updated_at: new Date().toISOString(),
    updated_by: actor.id,
  };

  if (payload.amount !== undefined) {
    updatePayload.amount_cents = amountToCents(payload.amount);
  }

  if (payload.type !== undefined) {
    updatePayload.type = payload.type;
  }

  if (payload.category !== undefined) {
    updatePayload.category = payload.category;
  }

  if (payload.occurredOn !== undefined) {
    updatePayload.occurred_on = payload.occurredOn;
  }

  if (payload.notes !== undefined) {
    updatePayload.notes = normalizeNotes(payload.notes);
  }

  const entries = Object.entries(updatePayload);
  const assignments = entries.map(([column]) => `${column} = ?`).join(', ');

  await db.run(
    `UPDATE financial_records SET ${assignments} WHERE id = ?`,
    [...entries.map(([, value]) => value), recordId]
  );

  return getRecordById(recordId);
}

async function deleteRecord(recordId, actor) {
  await getRecordById(recordId);
  const timestamp = new Date().toISOString();

  await db.run(
    'UPDATE financial_records SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ?',
    [timestamp, timestamp, actor.id, recordId]
  );
}

async function restoreRecord(recordId, actor) {
  const row = await fetchRecordRowById(recordId, { includeDeleted: true });

  if (!row) {
    throw new AppError(404, 'Record not found.');
  }

  if (!row.deleted_at) {
    throw new AppError(409, 'Record is not deleted.');
  }

  const timestamp = new Date().toISOString();

  await db.run(
    'UPDATE financial_records SET deleted_at = NULL, updated_at = ?, updated_by = ? WHERE id = ?',
    [timestamp, actor.id, recordId]
  );

  return getRecordById(recordId);
}

module.exports = {
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
};
