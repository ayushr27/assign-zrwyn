const bcrypt = require('bcryptjs');
const db = require('./client');

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@finance.local',
    password: 'Admin123!',
    role: 'admin',
    status: 'active',
  },
  {
    name: 'Insight Analyst',
    email: 'analyst@finance.local',
    password: 'Analyst123!',
    role: 'analyst',
    status: 'active',
  },
  {
    name: 'Read Only Viewer',
    email: 'viewer@finance.local',
    password: 'Viewer123!',
    role: 'viewer',
    status: 'active',
  },
];

const seedRecords = [
  { amount: 500000, type: 'income', category: 'Salary', occurredOn: '2026-01-05', notes: 'Primary monthly salary' },
  { amount: 180000, type: 'expense', category: 'Rent', occurredOn: '2026-01-06', notes: 'Apartment rent' },
  { amount: 32045, type: 'expense', category: 'Groceries', occurredOn: '2026-01-12', notes: 'Bi-weekly groceries' },
  { amount: 120000, type: 'income', category: 'Freelance', occurredOn: '2026-02-03', notes: 'Consulting invoice' },
  { amount: 21010, type: 'expense', category: 'Utilities', occurredOn: '2026-02-14', notes: 'Electricity and internet' },
  { amount: 40000, type: 'income', category: 'Investments', occurredOn: '2026-03-08', notes: 'ETF dividend payout' },
  { amount: 65000, type: 'expense', category: 'Travel', occurredOn: '2026-03-18', notes: 'Client meeting trip' },
];

let initialized = false;

async function createUsersTable() {
  const statements = db.isPostgres()
    ? [
        `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            last_login_at TIMESTAMPTZ,
            archived_at TIMESTAMPTZ,
            archived_by INTEGER REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          )
        `,
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
        'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
        'CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at)',
      ]
    : [
        `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            last_login_at TEXT,
            archived_at TEXT,
            archived_by INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (archived_by) REFERENCES users(id)
          )
        `,
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
        'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
        'CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at)',
      ];

  for (const statement of statements) {
    await db.exec(statement);
  }
}

async function createFinancialRecordsTable() {
  const statements = db.isPostgres()
    ? [
        `
          CREATE TABLE IF NOT EXISTS financial_records (
            id SERIAL PRIMARY KEY,
            amount_cents INTEGER NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
            category VARCHAR(120) NOT NULL,
            occurred_on DATE NOT NULL,
            notes TEXT,
            created_by INTEGER NOT NULL REFERENCES users(id),
            updated_by INTEGER REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL,
            deleted_at TIMESTAMPTZ
          )
        `,
        'CREATE INDEX IF NOT EXISTS idx_financial_records_occurred_on ON financial_records(occurred_on)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_category ON financial_records(category)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_deleted_at ON financial_records(deleted_at)',
      ]
    : [
        `
          CREATE TABLE IF NOT EXISTS financial_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount_cents INTEGER NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            category TEXT NOT NULL,
            occurred_on TEXT NOT NULL,
            notes TEXT,
            created_by INTEGER NOT NULL,
            updated_by INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT,
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
          )
        `,
        'CREATE INDEX IF NOT EXISTS idx_financial_records_occurred_on ON financial_records(occurred_on)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_category ON financial_records(category)',
        'CREATE INDEX IF NOT EXISTS idx_financial_records_deleted_at ON financial_records(deleted_at)',
      ];

  for (const statement of statements) {
    await db.exec(statement);
  }
}

async function createSchema() {
  await createUsersTable();
  await createFinancialRecordsTable();
}

async function dropSchema() {
  if (db.isPostgres()) {
    await db.exec('DROP TABLE IF EXISTS financial_records CASCADE');
    await db.exec('DROP TABLE IF EXISTS users CASCADE');
    return;
  }

  await db.exec('DROP TABLE IF EXISTS financial_records');
  await db.exec('DROP TABLE IF EXISTS users');
}

async function seedDemoUsers() {
  const row = await db.get('SELECT COUNT(*) AS count FROM users');

  if (Number(row.count) > 0) {
    return;
  }

  for (const user of seedUsers) {
    const timestamp = new Date().toISOString();
    const passwordHash = await bcrypt.hash(user.password, 10);

    await db.run(
      `
        INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [user.name, user.email, passwordHash, user.role, user.status, timestamp, timestamp]
    );
  }
}

async function seedDemoRecords() {
  const row = await db.get('SELECT COUNT(*) AS count FROM financial_records');

  if (Number(row.count) > 0) {
    return;
  }

  const admin = await db.get('SELECT id FROM users WHERE email = ?', ['admin@finance.local']);

  for (const record of seedRecords) {
    const timestamp = new Date().toISOString();

    await db.run(
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
        record.amount,
        record.type,
        record.category,
        record.occurredOn,
        record.notes,
        admin.id,
        admin.id,
        timestamp,
        timestamp,
      ]
    );
  }
}

async function initializeDatabase(options = {}) {
  const { reset = false } = options;

  if (reset) {
    await dropSchema();
    initialized = false;
  }

  await createSchema();

  if (!initialized) {
    await seedDemoUsers();
    await seedDemoRecords();
    initialized = true;
  }
}

async function destroyDatabase() {
  initialized = false;
  db.close();
}

module.exports = {
  initializeDatabase,
  destroyDatabase,
};
