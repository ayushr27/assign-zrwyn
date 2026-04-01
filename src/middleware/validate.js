const { AppError } = require('../utils/errors');

function validate(schema, property = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return next(
        new AppError(
          400,
          'Validation failed.',
          error.details.map((detail) => detail.message)
        )
      );
    }

    req[property] = value;
    next();
  };
}

module.exports = {
  validate,
};
