const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const env = require('../config/env');

let database;

function isPostgres() {
  return env.dbClient === 'postgres';
}

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function getSqliteDatabase() {
  if (!database) {
    if (env.dbFilename !== ':memory:') {
      fs.mkdirSync(path.dirname(env.dbFilename), { recursive: true });
    }

    database = new Database(env.dbFilename);
    database.pragma('foreign_keys = ON');
  }

  return database;
}

async function getDatabase() {
  if (database) {
    return database;
  }

  if (isPostgres()) {
    database = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
      max: env.dbPoolMax,
    });
    return database;
  }

  return getSqliteDatabase();
}

async function exec(sql) {
  const connection = await getDatabase();

  if (isPostgres()) {
    return connection.query(sql);
  }

  return connection.exec(sql);
}

async function get(sql, params = []) {
  const connection = await getDatabase();

  if (isPostgres()) {
    const result = await connection.query(convertPlaceholders(sql), params);
    return result.rows[0];
  }

  return connection.prepare(sql).get(...params);
}

async function all(sql, params = []) {
  const connection = await getDatabase();

  if (isPostgres()) {
    const result = await connection.query(convertPlaceholders(sql), params);
    return result.rows;
  }

  return connection.prepare(sql).all(...params);
}

async function run(sql, params = []) {
  const connection = await getDatabase();

  if (isPostgres()) {
    let query = convertPlaceholders(sql);

    if (/^\s*insert\b/i.test(query) && !/\breturning\b/i.test(query)) {
      query = `${query} RETURNING id`;
    }

    const result = await connection.query(query, params);
    return {
      rowCount: result.rowCount,
      rows: result.rows,
      lastInsertRowid:
        result.rows[0] && result.rows[0].id !== undefined ? Number(result.rows[0].id) : undefined,
    };
  }

  const result = connection.prepare(sql).run(...params);
  return {
    rowCount: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}

function getDateBucketExpression(granularity, column) {
  if (isPostgres()) {
    return granularity === 'weekly'
      ? `TO_CHAR(DATE_TRUNC('week', ${column}::timestamp), 'IYYY-"W"IW')`
      : `TO_CHAR(DATE_TRUNC('month', ${column}::timestamp), 'YYYY-MM')`;
  }

  return granularity === 'weekly'
    ? `strftime('%Y-W%W', ${column})`
    : `strftime('%Y-%m', ${column})`;
}

async function close() {
  if (database) {
    if (isPostgres()) {
      await database.end();
    } else {
      database.close();
    }

    database = undefined;
  }
}

module.exports = {
  isPostgres,
  exec,
  get,
  all,
  run,
  getDateBucketExpression,
  close,
};
