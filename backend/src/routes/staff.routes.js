'use strict';

const { Router } = require('express');
const staffController = require('../controllers/staff.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');
const { createStaffSchema, updateStaffSchema, onlineStatusSchema } = require('../validators/staff.validators');

const router = Router();

// GET /api/v1/staff — Admin or Supervisor
router.get('/', authenticate, requireRole('admin', 'supervisor'), staffController.list);

// POST /api/v1/staff — Admin only
router.post('/', authenticate, requireRole('admin'), validate(createStaffSchema), staffController.create);

// PUT /api/v1/staff/:id — Admin only
router.put('/:id', authenticate, requireRole('admin'), validate(updateStaffSchema), staffController.update);

// DELETE /api/v1/staff/:id — Admin only
router.delete('/:id', authenticate, requireRole('admin'), staffController.delete);

// PATCH /api/v1/staff/:id/online-status — Staff (own) or Admin
router.patch('/:id/online-status', authenticate, validate(onlineStatusSchema), staffController.updateOnlineStatus);

module.exports = router;
