'use strict';

const { Router } = require('express');
const settingsController = require('../controllers/settings.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');
const { updateSettingsSchema } = require('../validators/settings.validators');

const router = Router();

// GET /api/v1/settings — Public (org name used by display board, kiosk)
router.get('/', settingsController.get);

// PUT /api/v1/settings — Admin only
router.put('/', authenticate, requireRole('admin'), validate(updateSettingsSchema), settingsController.update);

module.exports = router;
