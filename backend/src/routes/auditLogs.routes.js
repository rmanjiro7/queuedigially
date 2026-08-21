'use strict';

const { Router } = require('express');
const auditLogsController = require('../controllers/auditLogs.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// GET /api/v1/audit-logs — Admin only
router.get('/', authenticate, requireRole('admin'), auditLogsController.list);

module.exports = router;
