const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
});

module.exports = {
  loginSchema,
};
