const Joi = require('joi');

function isValidIsoDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDate = Joi.string()
  .custom((value, helpers) => {
    if (!isValidIsoDateString(value)) {
      return helpers.error('date.invalid');
    }

    return value;
  }, 'ISO date validation')
  .messages({
    'date.invalid': '{{#label}} must be a valid date in YYYY-MM-DD format.',
  });

function validateDateRange(value, helpers) {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    return helpers.message('"endDate" must be greater than or equal to "startDate".');
  }

  return value;
}

module.exports = {
  isoDate,
  validateDateRange,
};
