const { AppError } = require('../utils/errors');
const { hasPermission } = require('../utils/permissions');

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return next(new AppError(403, 'You do not have permission to perform this action.'));
    }

    next();
  };
}

module.exports = {
  requirePermission,
};
