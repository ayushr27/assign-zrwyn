const Joi = require('joi');
const { isoDate, validateDateRange } = require('../../utils/date-schema');

const amount = Joi.alternatives().try(
  Joi.number().positive().precision(2),
  Joi.string().pattern(/^\d+(\.\d{1,2})?$/)
);

const recordIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createRecordSchema = Joi.object({
  amount: amount.required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().trim().min(2).max(120).required(),
  occurredOn: isoDate.required(),
  notes: Joi.string().trim().max(1000).allow('', null).optional(),
});

const updateRecordSchema = Joi.object({
  amount,
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().trim().min(2).max(120),
  occurredOn: isoDate,
  notes: Joi.string().trim().max(1000).allow('', null),
}).min(1);

const recordsQuerySchema = Joi.object({
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().trim().max(120).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  minAmount: amount.optional(),
  maxAmount: amount.optional(),
  search: Joi.string().trim().max(120).optional(),
  sortBy: Joi.string().valid('occurredOn', 'amount', 'category', 'createdAt', 'updatedAt').default('occurredOn'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().positive().default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
}).custom((value, helpers) => {
  const dateValidated = validateDateRange(value, helpers);

  if (dateValidated && dateValidated.minAmount && dateValidated.maxAmount) {
    const min = typeof dateValidated.minAmount === 'number' ? dateValidated.minAmount : Number(dateValidated.minAmount);
    const max = typeof dateValidated.maxAmount === 'number' ? dateValidated.maxAmount : Number(dateValidated.maxAmount);

    if (min > max) {
      return helpers.message('"maxAmount" must be greater than or equal to "minAmount".');
    }
  }

  return dateValidated;
}, 'record query validation');

module.exports = {
  recordIdParamSchema,
  createRecordSchema,
  updateRecordSchema,
  recordsQuerySchema,
};
