'use strict';

const { Router } = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// GET /api/v1/stats — Admin or Supervisor
router.get('/', authenticate, requireRole('admin', 'supervisor'), statsController.get);

module.exports = router;
