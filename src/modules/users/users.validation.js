const Joi = require('joi');
const { ROLES, USER_STATUSES } = require('../../utils/permissions');

const email = Joi.string().trim().email({ tlds: { allow: false } }).lowercase().max(255);
const password = Joi.string().min(8).max(128);

const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const usersQuerySchema = Joi.object({
  role: Joi.string().valid(...ROLES).optional(),
  status: Joi.string().valid(...USER_STATUSES).optional(),
  search: Joi.string().trim().max(120).optional(),
  includeArchived: Joi.boolean().default(false),
  page: Joi.number().integer().positive().default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: email.required(),
  password: password.required(),
  role: Joi.string().valid(...ROLES).required(),
  status: Joi.string().valid(...USER_STATUSES).default('active'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  email,
  password,
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid(...USER_STATUSES),
}).min(1);

module.exports = {
  userIdParamSchema,
  usersQuerySchema,
  createUserSchema,
  updateUserSchema,
};
