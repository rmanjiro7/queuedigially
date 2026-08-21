'use strict';

const { Router } = require('express');
const displayController = require('../controllers/display.controller');
const { displayLimiter } = require('../middlewares/rateLimiter');

const router = Router();

// GET /api/v1/display — Public (TV Signage / Display Board)
router.get('/', displayLimiter, displayController.get);

module.exports = router;
