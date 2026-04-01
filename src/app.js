const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const { createOpenApiSpec } = require('./config/swagger');
const db = require('./db/client');
const { initializeDatabase } = require('./db/setup');
const { asyncHandler } = require('./utils/async-handler');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const recordRoutes = require('./modules/records/records.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const { errorHandler, notFound } = require('./middleware/error-handler');

async function createApp(options = {}) {
  const { resetDatabase = false } = options;
  await initializeDatabase({ reset: resetDatabase });

  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  if (env.environment !== 'test') {
    app.use(morgan('dev'));
    app.use(
      rateLimit({
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  app.get('/health', asyncHandler(async (_req, res) => {
    const databaseCheck = await db.get('SELECT 1 AS ok');

    res.json({
      status: 'ok',
      environment: env.environment,
      database: databaseCheck && databaseCheck.ok === 1 ? 'ok' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(createOpenApiSpec()));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/records', recordRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
