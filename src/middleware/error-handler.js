const { AppError } = require('../utils/errors');

function notFound(_req, _res, next) {
  next(new AppError(404, 'Route not found.'));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || 'Internal server error.',
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  res.status(statusCode).json({
    error: payload,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
