'use strict';

/**
 * errorHandler.js — Central Express error handling middleware.
 *
 * Catches all errors passed via next(err).
 * Returns consistent error envelope.
 * Suppresses stack traces and internal details in production.
 */

const logger = require('../config/logger');
const env = require('../config/env');

/**
 * Custom application error class.
 * Use this to throw domain errors with known status codes.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode] - HTTP status code
   * @param {string} [code] - Machine-readable error code
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware (4 args required).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log every error server-side (never log passwords or tokens)
  logger.error('Unhandled error', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    stack: env.isDevelopment ? err.stack : undefined,
  });

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      code: 'UNAUTHORIZED',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // SQLite unique constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      code: 'CONFLICT',
    });
  }

  // Unknown error — hide details in production
  const statusCode = err.statusCode || err.status || 500;
  const message = env.isProduction ? 'An unexpected error occurred' : (err.message || 'Internal server error');

  const body = {
    success: false,
    message,
    code: 'INTERNAL_ERROR',
  };

  if (env.isDevelopment && err.stack) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}

module.exports = { errorHandler, AppError };
