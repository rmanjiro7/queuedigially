'use strict';

const { Router } = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');
const { seed } = require('../utils/seed');
const auditLogService = require('../services/auditLog.service');
const { success } = require('../utils/response');
const { AUDIT_TYPE } = require('../constants');
const logger = require('../config/logger');

const router = Router();

/**
 * POST /api/v1/admin/reset-demo
 * Truncates all tables and re-seeds demo data.
 * Admin only. Use with caution.
 */
router.post('/reset-demo', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const db = require('../config/database');

    // Clear all tables
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM tokens;
      DELETE FROM staff;
      DELETE FROM services;
      DELETE FROM settings;
      DELETE FROM admin_users;
    `);

    logger.info('All tables cleared for demo reset', { actor: req.user?.email });

    // Re-seed
    await seed();

    auditLogService.log({
      action: 'Demo Data Reset',
      actor: req.user?.email || 'Administrator',
      details: 'System reset to initial demo dataset',
      type: AUDIT_TYPE.WARNING,
    });

    return success(res, null, 'Demo data restored successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/ws-status
 * Returns WebSocket connection count.
 */
router.get('/ws-status', authenticate, requireRole('admin'), (req, res, next) => {
  try {
    const { getClientCount } = require('../websocket/wsBroadcast');
    return success(res, { connectedClients: getClientCount() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
