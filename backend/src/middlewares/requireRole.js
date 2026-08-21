'use strict';

/**
 * requireRole.js — Role-based authorization middleware.
 *
 * Must be used AFTER authenticate middleware.
 * Rejects requests where req.user.role is not in the allowed list.
 *
 * Usage:
 *   router.post('/admin-only', authenticate, requireRole('admin'), controller.method);
 *   router.get('/staff-or-admin', authenticate, requireRole('operator','supervisor','admin'), controller.method);
 */

const { AppError } = require('./errorHandler');

/**
 * @param {...string} allowedRoles - One or more allowed role strings
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
}

module.exports = requireRole;
