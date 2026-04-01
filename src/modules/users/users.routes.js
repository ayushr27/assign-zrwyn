const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { requirePermission } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/async-handler');
const {
  archiveUserController,
  createUserController,
  getUserController,
  listUsersController,
  restoreUserController,
  updateUserController,
} = require('./users.controller');
const {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  usersQuerySchema,
} = require('./users.validation');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('users:manage'));

router.get('/', validate(usersQuerySchema, 'query'), asyncHandler(listUsersController));
router.get('/:id', validate(userIdParamSchema, 'params'), asyncHandler(getUserController));
router.post('/', validate(createUserSchema), asyncHandler(createUserController));
router.patch('/:id', validate(userIdParamSchema, 'params'), validate(updateUserSchema), asyncHandler(updateUserController));
router.delete('/:id', validate(userIdParamSchema, 'params'), asyncHandler(archiveUserController));
router.post('/:id/restore', validate(userIdParamSchema, 'params'), asyncHandler(restoreUserController));

module.exports = router;
