'use strict';

const { Router } = require('express');
const tokensController = require('../controllers/tokens.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const { tokenCreateLimiter } = require('../middlewares/rateLimiter');
const {
  createTokenSchema,
  updateTokenStatusSchema,
  callNextSchema,
  delayTokenSchema,
} = require('../validators/token.validators');

const router = Router();

// POST /api/v1/tokens — Public: customer creates a token
router.post('/', tokenCreateLimiter, validate(createTokenSchema), tokensController.create);

// GET /api/v1/tokens — Staff/Admin: list tokens with filters
router.get('/', authenticate, tokensController.list);

// GET /api/v1/tokens/:tokenNumber — Public: look up a token by number (e.g. A-042)
router.get('/:tokenNumber', tokensController.getByTokenNumber);

// POST /api/v1/tokens/call-next — Staff: call next eligible token
router.post('/call-next', authenticate, validate(callNextSchema), tokensController.callNext);

// PATCH /api/v1/tokens/:id/status — Staff: update token status
router.patch('/:id/status', authenticate, validate(updateTokenStatusSchema), tokensController.updateStatus);

// POST /api/v1/tokens/:id/recall — Staff: recall a skipped token
router.post('/:id/recall', authenticate, tokensController.recall);

// PATCH /api/v1/tokens/:id/delay — Public: customer requests delay
router.patch('/:id/delay', validate(delayTokenSchema), tokensController.delay);

module.exports = router;
