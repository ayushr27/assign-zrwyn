const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { requirePermission } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/async-handler');
const {
  createRecordController,
  deleteRecordController,
  getRecordController,
  listRecordsController,
  restoreRecordController,
  updateRecordController,
} = require('./records.controller');
const {
  createRecordSchema,
  recordIdParamSchema,
  recordsQuerySchema,
  updateRecordSchema,
} = require('./records.validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('records:read'), validate(recordsQuerySchema, 'query'), asyncHandler(listRecordsController));
router.get('/:id', requirePermission('records:read'), validate(recordIdParamSchema, 'params'), asyncHandler(getRecordController));
router.post('/', requirePermission('records:write'), validate(createRecordSchema), asyncHandler(createRecordController));
router.patch('/:id', requirePermission('records:write'), validate(recordIdParamSchema, 'params'), validate(updateRecordSchema), asyncHandler(updateRecordController));
router.delete('/:id', requirePermission('records:write'), validate(recordIdParamSchema, 'params'), asyncHandler(deleteRecordController));
router.post('/:id/restore', requirePermission('records:write'), validate(recordIdParamSchema, 'params'), asyncHandler(restoreRecordController));

module.exports = router;
