const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/async-handler');
const { loginController, meController } = require('./auth.controller');
const { loginSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(loginController));
router.get('/me', authenticate, asyncHandler(meController));

module.exports = router;
