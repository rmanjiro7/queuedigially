'use strict';

/**
 * auth.middleware.js — JWT verification middleware.
 *
 * Verifies the Bearer token in the Authorization header.
 * Attaches decoded payload to req.user on success.
 * Calls next(AppError) on failure — handled by errorHandler.
 *
 * Usage:
 *   router.get('/protected', authenticate, controller.method);
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

/**
 * Require a valid JWT. Attaches req.user = { sub, role, name|email, iat, exp }.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError('Authentication token required', 401, 'UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    next(err); // JsonWebTokenError or TokenExpiredError — errorHandler handles these
  }
}

module.exports = { authenticate };
