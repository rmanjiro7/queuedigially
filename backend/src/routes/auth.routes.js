'use strict';

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { adminLoginSchema, staffLoginSchema, forgotPasswordSchema } = require('../validators/auth.validators');

const router = Router();

// POST /api/v1/auth/admin/login
router.post('/admin/login', authLimiter, validate(adminLoginSchema), authController.adminLogin);

// POST /api/v1/auth/staff/login
router.post('/staff/login', authLimiter, validate(staffLoginSchema), authController.staffLogin);

// POST /api/v1/auth/admin/forgot-password
router.post('/admin/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.adminForgotPassword);

// GET /api/v1/auth/me  — requires valid JWT
router.get('/me', authenticate, authController.getMe);

module.exports = router;
