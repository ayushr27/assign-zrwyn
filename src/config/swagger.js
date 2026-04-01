const env = require('./env');

function createOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Finance Dashboard Backend API',
      version: '1.0.0',
      description: 'Backend for managing users, finance records, and dashboard analytics with role-based access control.',
    },
    servers: [
      {
        url: '/',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Validation failed.' },
                details: {
                  type: 'array',
                  nullable: true,
                  items: { type: 'string' },
                },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@finance.local' },
            password: { type: 'string', example: 'Admin123!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', example: 'Operations Viewer' },
            email: { type: 'string', example: 'ops.viewer@finance.local' },
            password: { type: 'string', example: 'OpsViewer123!' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Updated Name' },
            email: { type: 'string', example: 'updated.user@finance.local' },
            password: { type: 'string', example: 'UpdatedPass123!' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'inactive' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'System Admin' },
            email: { type: 'string', example: 'admin@finance.local' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            permissions: {
              type: 'array',
              items: { type: 'string' },
            },
            lastLoginAt: { type: 'string', nullable: true, example: '2026-04-01T10:00:00.000Z' },
            isArchived: { type: 'boolean', example: false },
            archivedAt: { type: 'string', nullable: true, example: null },
            archivedBy: { type: 'integer', nullable: true, example: null },
            createdAt: { type: 'string', example: '2026-04-01T09:00:00.000Z' },
            updatedAt: { type: 'string', example: '2026-04-01T09:00:00.000Z' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/User' },
          },
        },
        UserListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 10 },
                totalItems: { type: 'integer', example: 3 },
                totalPages: { type: 'integer', example: 1 },
              },
            },
          },
        },
        CreateRecordRequest: {
          type: 'object',
          required: ['amount', 'type', 'category', 'occurredOn'],
          properties: {
            amount: { type: 'number', example: 149.99 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string', example: 'Software' },
            occurredOn: { type: 'string', example: '2026-04-01' },
            notes: { type: 'string', nullable: true, example: 'License renewal' },
          },
        },
        UpdateRecordRequest: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 199.99 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string', example: 'Operations' },
            occurredOn: { type: 'string', example: '2026-04-02' },
            notes: { type: 'string', nullable: true, example: 'Updated note' },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 10 },
            amount: { type: 'number', example: 1250.5 },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string', example: 'Rent' },
            occurredOn: { type: 'string', example: '2026-03-25' },
            notes: { type: 'string', nullable: true, example: 'Quarterly adjustment' },
            createdAt: { type: 'string', example: '2026-04-01T09:00:00.000Z' },
            updatedAt: { type: 'string', example: '2026-04-01T09:30:00.000Z' },
            createdBy: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'System Admin' },
              },
            },
            updatedBy: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'System Admin' },
              },
            },
          },
        },
        FinancialRecordResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/FinancialRecord' },
          },
        },
        FinancialRecordListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/FinancialRecord' },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 10 },
                totalItems: { type: 'integer', example: 7 },
                totalPages: { type: 'integer', example: 1 },
                filters: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', nullable: true },
                    category: { type: 'string', nullable: true },
                    startDate: { type: 'string', nullable: true },
                    endDate: { type: 'string', nullable: true },
                    minAmount: { type: 'number', nullable: true },
                    maxAmount: { type: 'number', nullable: true },
                    search: { type: 'string', nullable: true },
                    sortBy: { type: 'string', example: 'occurredOn' },
                    sortOrder: { type: 'string', example: 'desc' },
                  },
                },
              },
            },
          },
        },
        DashboardSummaryResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/DashboardSummary' },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            generatedAt: { type: 'string', example: '2026-04-01T09:00:00.000Z' },
            range: {
              type: 'object',
              properties: {
                startDate: { type: 'string', nullable: true },
                endDate: { type: 'string', nullable: true },
                granularity: { type: 'string', example: 'monthly' },
              },
            },
            totals: {
              type: 'object',
              properties: {
                income: { type: 'number', example: 6600 },
                expenses: { type: 'number', example: 2980.55 },
                netBalance: { type: 'number', example: 3619.45 },
                recordCount: { type: 'integer', example: 7 },
              },
            },
            categoryBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', example: 'Rent' },
                  type: { type: 'string', example: 'expense' },
                  totalAmount: { type: 'number', example: 1800 },
                },
              },
            },
            trend: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bucket: { type: 'string', example: '2026-03' },
                  income: { type: 'number', example: 400 },
                  expenses: { type: 'number', example: 650 },
                  netBalance: { type: 'number', example: -250 },
                },
              },
            },
            recentActivity: {
              type: 'array',
              items: { $ref: '#/components/schemas/FinancialRecord' },
            },
          },
        },
        DashboardInsights: {
          type: 'object',
          properties: {
            generatedAt: { type: 'string', example: '2026-04-01T09:00:00.000Z' },
            range: {
              type: 'object',
              properties: {
                startDate: { type: 'string', nullable: true },
                endDate: { type: 'string', nullable: true },
                granularity: { type: 'string', example: 'monthly' },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                incomeRecordCount: { type: 'integer', example: 3 },
                expenseRecordCount: { type: 'integer', example: 4 },
                averageIncomeEntry: { type: 'number', example: 2200 },
                averageExpenseEntry: { type: 'number', example: 745.14 },
                largestIncome: { type: 'number', example: 5000 },
                largestExpense: { type: 'number', example: 1800 },
                savingsRate: { type: 'number', example: 54.84 },
                expenseRatio: { type: 'number', example: 45.16 },
              },
            },
            topCategories: {
              type: 'object',
              properties: {
                expenses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', example: 'Rent' },
                      totalAmount: { type: 'number', example: 1800 },
                    },
                  },
                },
                income: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', example: 'Salary' },
                      totalAmount: { type: 'number', example: 5000 },
                    },
                  },
                },
              },
            },
            bestPeriod: {
              type: 'object',
              nullable: true,
              properties: {
                bucket: { type: 'string', example: '2026-01' },
                income: { type: 'number', example: 5000 },
                expenses: { type: 'number', example: 2120.45 },
                netBalance: { type: 'number', example: 2879.55 },
              },
            },
            worstPeriod: {
              type: 'object',
              nullable: true,
              properties: {
                bucket: { type: 'string', example: '2026-03' },
                income: { type: 'number', example: 400 },
                expenses: { type: 'number', example: 650 },
                netBalance: { type: 'number', example: -250 },
              },
            },
          },
        },
        DashboardInsightsResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/DashboardInsights' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate a user and return a JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get the currently authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/users': {
        get: {
          summary: 'List users',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'role', schema: { type: 'string', enum: ['viewer', 'analyst', 'admin'] } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['active', 'inactive'] } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'includeArchived', schema: { type: 'boolean', default: false } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Users fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserListResponse' },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a user',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/users/{id}': {
        get: {
          summary: 'Get a user by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'User fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update a user by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateUserRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
            400: {
              description: 'Validation or business rule failure',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Archive a user by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            204: {
              description: 'User archived successfully',
            },
          },
        },
      },
      '/api/users/{id}/restore': {
        post: {
          summary: 'Restore an archived user',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'User restored successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' },
                },
              },
            },
          },
        },
      },
      '/api/records': {
        get: {
          summary: 'List finance records',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', example: '2026-01-01' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', example: '2026-03-31' } },
            { in: 'query', name: 'minAmount', schema: { type: 'number', example: 100 } },
            { in: 'query', name: 'maxAmount', schema: { type: 'number', example: 2000 } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['occurredOn', 'amount', 'category', 'createdAt', 'updatedAt'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Records fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FinancialRecordListResponse' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a finance record',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateRecordRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Record created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FinancialRecordResponse' },
                },
              },
            },
          },
        },
      },
      '/api/records/{id}': {
        get: {
          summary: 'Get a finance record by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Record fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FinancialRecordResponse' },
                },
              },
            },
            404: {
              description: 'Record not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update a finance record by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateRecordRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Record updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FinancialRecordResponse' },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Soft delete a finance record by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            204: {
              description: 'Record deleted successfully',
            },
          },
        },
      },
      '/api/records/{id}/restore': {
        post: {
          summary: 'Restore a soft-deleted finance record',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Record restored successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FinancialRecordResponse' },
                },
              },
            },
          },
        },
      },
      '/api/dashboard/summary': {
        get: {
          summary: 'Fetch summary analytics for the dashboard',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'startDate', schema: { type: 'string', example: '2026-01-01' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', example: '2026-03-31' } },
            { in: 'query', name: 'granularity', schema: { type: 'string', enum: ['monthly', 'weekly'] } },
            { in: 'query', name: 'limitRecent', schema: { type: 'integer', default: 5 } },
          ],
          responses: {
            200: {
              description: 'Dashboard summary returned',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DashboardSummaryResponse' },
                },
              },
            },
            400: {
              description: 'Validation failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/dashboard/insights': {
        get: {
          summary: 'Fetch deeper financial insights for analysts and admins',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'startDate', schema: { type: 'string', example: '2026-01-01' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', example: '2026-03-31' } },
            { in: 'query', name: 'granularity', schema: { type: 'string', enum: ['monthly', 'weekly'] } },
            { in: 'query', name: 'categoryLimit', schema: { type: 'integer', default: 3 } },
          ],
          responses: {
            200: {
              description: 'Dashboard insights returned',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DashboardInsightsResponse' },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
  };
}

module.exports = {
  createOpenApiSpec,
};
