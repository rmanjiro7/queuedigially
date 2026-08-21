'use strict';

const { Router } = require('express');
const servicesController = require('../controllers/services.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');
const { createServiceSchema, updateServiceSchema } = require('../validators/service.validators');

const router = Router();

// GET /api/v1/services — Public: display board, kiosk, customer view all need this
router.get('/', servicesController.list);

// POST /api/v1/services — Admin only
router.post('/', authenticate, requireRole('admin'), validate(createServiceSchema), servicesController.create);

// PUT /api/v1/services/:id — Admin only
router.put('/:id', authenticate, requireRole('admin'), validate(updateServiceSchema), servicesController.update);

// DELETE /api/v1/services/:id — Admin only
router.delete('/:id', authenticate, requireRole('admin'), servicesController.delete);

module.exports = router;
