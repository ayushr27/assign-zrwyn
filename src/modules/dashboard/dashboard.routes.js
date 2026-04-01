const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { requirePermission } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/async-handler');
const { getInsightsController, getSummaryController } = require('./dashboard.controller');
const { insightsQuerySchema, summaryQuerySchema } = require('./dashboard.validation');

const router = express.Router();

router.use(authenticate);

router.get(
  '/summary',
  requirePermission('dashboard:read'),
  validate(summaryQuerySchema, 'query'),
  asyncHandler(getSummaryController)
);

router.get(
  '/insights',
  requirePermission('dashboard:insights'),
  validate(insightsQuerySchema, 'query'),
  asyncHandler(getInsightsController)
);

module.exports = router;
