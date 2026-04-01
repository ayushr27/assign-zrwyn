process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = ':memory:';

const request = require('supertest');
const { createApp } = require('../src/app');
const { destroyDatabase, initializeDatabase } = require('../src/db/setup');

let app;

async function loginAs(email, password) {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  return response.body.data.token;
}

beforeAll(async () => {
  app = await createApp({ resetDatabase: true });
});

beforeEach(async () => {
  await initializeDatabase({ reset: true });
});

afterAll(async () => {
  await destroyDatabase();
});

describe('finance dashboard backend', () => {
  test('root route returns service metadata for deployment landing pages', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: 'Finance Dashboard Backend API',
      status: 'ok',
      docsPath: '/api/docs',
      healthPath: '/health',
    });
  });

  test('authenticates seeded admin user and returns the current profile', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@finance.local',
      password: 'Admin123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.role).toBe('admin');
    expect(loginResponse.body.data.token).toBeTruthy();

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe('admin@finance.local');
    expect(meResponse.body.data.permissions).toContain('users:manage');
  });

  test('viewer can read dashboard summary but cannot access financial records', async () => {
    const token = await loginAs('viewer@finance.local', 'Viewer123!');

    const summaryResponse = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.data.totals.recordCount).toBe(7);

    const recordsResponse = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${token}`);

    expect(recordsResponse.status).toBe(403);
    expect(recordsResponse.body.error.message).toMatch(/permission/i);
  });

  test('analyst can list records but cannot create them', async () => {
    const token = await loginAs('analyst@finance.local', 'Analyst123!');

    const listResponse = await request(app)
      .get('/api/records?type=expense&page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta.totalItems).toBe(4);
    expect(listResponse.body.data.every((record) => record.type === 'expense')).toBe(true);

    const createResponse = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 99.99,
        type: 'expense',
        category: 'Software',
        occurredOn: '2026-04-01',
        notes: 'Analyst should not be allowed to create this',
      });

    expect(createResponse.status).toBe(403);
  });

  test('admin can create, update, and soft-delete a record', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const createResponse = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '99.99',
        type: 'expense',
        category: 'Software',
        occurredOn: '2026-04-01',
        notes: 'License renewal',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.amount).toBe(99.99);

    const recordId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .patch(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 149.99,
        notes: '',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.amount).toBe(149.99);
    expect(updateResponse.body.data.notes).toBeNull();

    const deleteResponse = await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const fetchDeletedResponse = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchDeletedResponse.status).toBe(404);
  });

  test('admin can manage users and inactive users cannot log in', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const createUserResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Operations Viewer',
        email: 'ops.viewer@finance.local',
        password: 'OpsViewer123!',
        role: 'viewer',
        status: 'active',
      });

    expect(createUserResponse.status).toBe(201);
    expect(createUserResponse.body.data.email).toBe('ops.viewer@finance.local');

    const updateUserResponse = await request(app)
      .patch(`/api/users/${createUserResponse.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'inactive',
      });

    expect(updateUserResponse.status).toBe(200);
    expect(updateUserResponse.body.data.status).toBe('inactive');

    const inactiveLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'ops.viewer@finance.local',
      password: 'OpsViewer123!',
    });

    expect(inactiveLoginResponse.status).toBe(403);
    expect(inactiveLoginResponse.body.error.message).toMatch(/inactive/i);
  });

  test('admin can archive and restore users while archived users are excluded by default', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const createUserResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Temporary Analyst',
        email: 'temp.analyst@finance.local',
        password: 'TempAnalyst123!',
        role: 'analyst',
        status: 'active',
      });

    expect(createUserResponse.status).toBe(201);
    const userId = createUserResponse.body.data.id;

    const archiveResponse = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(archiveResponse.status).toBe(204);

    const archivedLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'temp.analyst@finance.local',
      password: 'TempAnalyst123!',
    });

    expect(archivedLoginResponse.status).toBe(403);
    expect(archivedLoginResponse.body.error.message).toMatch(/archived/i);

    const defaultListResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(defaultListResponse.status).toBe(200);
    expect(defaultListResponse.body.data.some((user) => user.email === 'temp.analyst@finance.local')).toBe(false);
    expect(defaultListResponse.body.meta.totalItems).toBe(3);

    const archivedListResponse = await request(app)
      .get('/api/users?includeArchived=true&search=temp.analyst')
      .set('Authorization', `Bearer ${token}`);

    expect(archivedListResponse.status).toBe(200);
    expect(archivedListResponse.body.data).toHaveLength(1);
    expect(archivedListResponse.body.data[0].isArchived).toBe(true);

    const restoreResponse = await request(app)
      .post(`/api/users/${userId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.data.isArchived).toBe(false);
    expect(restoreResponse.body.data.status).toBe('inactive');
  });

  test('summary endpoint returns the expected seeded totals and trend data', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const response = await request(app)
      .get('/api/dashboard/summary?granularity=monthly&limitRecent=3')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.totals).toEqual({
      income: 6600,
      expenses: 2980.55,
      netBalance: 3619.45,
      recordCount: 7,
    });
    expect(response.body.data.trend.map((bucket) => bucket.bucket)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
    expect(response.body.data.categoryBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'Rent',
          type: 'expense',
          totalAmount: 1800,
        }),
        expect.objectContaining({
          category: 'Salary',
          type: 'income',
          totalAmount: 5000,
        }),
      ])
    );
    expect(response.body.data.recentActivity).toHaveLength(3);
  });

  test('analyst can access insights while viewer cannot', async () => {
    const analystToken = await loginAs('analyst@finance.local', 'Analyst123!');
    const viewerToken = await loginAs('viewer@finance.local', 'Viewer123!');

    const analystResponse = await request(app)
      .get('/api/dashboard/insights?granularity=monthly&categoryLimit=2')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(analystResponse.status).toBe(200);
    expect(analystResponse.body.data.metrics).toEqual({
      incomeRecordCount: 3,
      expenseRecordCount: 4,
      averageIncomeEntry: 2200,
      averageExpenseEntry: 745.14,
      largestIncome: 5000,
      largestExpense: 1800,
      savingsRate: 54.84,
      expenseRatio: 45.16,
    });
    expect(analystResponse.body.data.topCategories.expenses).toHaveLength(2);
    expect(analystResponse.body.data.bestPeriod.bucket).toBe('2026-01');
    expect(analystResponse.body.data.worstPeriod.bucket).toBe('2026-03');

    const viewerResponse = await request(app)
      .get('/api/dashboard/insights')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(viewerResponse.status).toBe(403);
  });

  test('record listing supports amount filters, sorting, and admin restore of soft-deleted records', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const filteredResponse = await request(app)
      .get('/api/records?minAmount=300&sortBy=amount&sortOrder=asc&page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);

    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body.data.map((record) => record.amount)).toEqual([320.45, 400, 650, 1200, 1800, 5000]);
    expect(filteredResponse.body.meta.filters.minAmount).toBe(300);
    expect(filteredResponse.body.meta.filters.sortBy).toBe('amount');

    const createResponse = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 250.75,
        type: 'expense',
        category: 'Equipment',
        occurredOn: '2026-04-03',
        notes: 'Monitor stand',
      });

    const recordId = createResponse.body.data.id;

    const deleteResponse = await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const restoreResponse = await request(app)
      .post(`/api/records/${recordId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.data.category).toBe('Equipment');

    const fetchResponse = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.data.amount).toBe(250.75);
  });

  test('rejects invalid calendar dates on record creation', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 49.99,
        type: 'expense',
        category: 'Software',
        occurredOn: '2026-02-30',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed.');
  });

  test('rejects date ranges where endDate is before startDate', async () => {
    const token = await loginAs('admin@finance.local', 'Admin123!');

    const response = await request(app)
      .get('/api/dashboard/summary?startDate=2026-03-01&endDate=2026-02-01')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed.');
    expect(response.body.error.details).toContain('"endDate" must be greater than or equal to "startDate".');
  });
});
