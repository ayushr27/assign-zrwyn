const path = require('path');
require('dotenv').config();

const rootDir = path.resolve(__dirname, '../..');
const databaseUrl = process.env.DATABASE_URL;

function detectDbClient(value) {
  if (value && /^(postgres|postgresql):\/\//i.test(value)) {
    return 'postgres';
  }

  return 'sqlite';
}

function resolveDatabaseFilename(value) {
  if (!value) {
    return path.join(rootDir, 'data', 'finance-dashboard.sqlite');
  }

  if (value === ':memory:') {
    return value;
  }

  return path.isAbsolute(value) ? value : path.join(rootDir, value);
}

module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  dbClient: detectDbClient(databaseUrl),
  databaseUrl: databaseUrl || null,
  dbFilename: detectDbClient(databaseUrl) === 'sqlite' ? resolveDatabaseFilename(databaseUrl) : null,
  databaseSsl: String(process.env.DATABASE_SSL || 'false').toLowerCase() === 'true',
  dbPoolMax: Number(process.env.DB_POOL_MAX || 10),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
  rootDir,
};
