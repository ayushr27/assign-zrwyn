const Joi = require('joi');
const { isoDate, validateDateRange } = require('../../utils/date-schema');

const baseDashboardQuerySchema = Joi.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  granularity: Joi.string().valid('monthly', 'weekly').default('monthly'),
});

const summaryQuerySchema = baseDashboardQuerySchema.keys({
  limitRecent: Joi.number().integer().min(1).max(20).default(5),
}).custom(validateDateRange, 'date range validation');

const insightsQuerySchema = baseDashboardQuerySchema.keys({
  categoryLimit: Joi.number().integer().min(1).max(10).default(3),
}).custom(validateDateRange, 'date range validation');

module.exports = {
  summaryQuerySchema,
  insightsQuerySchema,
};
