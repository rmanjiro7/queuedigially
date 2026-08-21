'use strict';

/**
 * auth.service.js — Authentication business logic.
 *
 * Handles admin (email+password) and staff (staffId+PIN) authentication.
 * Issues JWTs. Never returns password or PIN hashes.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const staffRepository = require('../repositories/staff.repository');
const env = require('../config/env');
const { AppError } = require('../middlewares/errorHandler');
const auditLogService = require('./auditLog.service');
const { AUDIT_TYPE } = require('../constants');

// ─── Internal helpers ─────────────────────────────────────────────────────────

function findAdminByEmail(email) {
  return db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.toLowerCase());
}

function issueJWT(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

const authService = {
  /**
   * Authenticate an admin user with email and password.
   * @returns {{ token: string, admin: object }}
   */
  async adminLogin(email, password) {
    const admin = findAdminByEmail(email);

    // Use constant-time comparison regardless of whether user exists (timing attack prevention)
    const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhashxx';
    const hashToCompare = admin ? admin.password_hash : dummyHash;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!admin || !isValid) {
      auditLogService.log({
        action: 'Failed Admin Login',
        actor: email,
        details: 'Invalid credentials provided',
        type: AUDIT_TYPE.WARNING,
      });
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = issueJWT({ sub: admin.id, role: admin.role, email: admin.email });

    auditLogService.log({
      action: 'Admin Login',
      actor: admin.email,
      details: 'Authenticated to Administrator Suite',
      type: AUDIT_TYPE.SUCCESS,
    });

    return {
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    };
  },

  /**
   * Authenticate a staff member with staffId and PIN.
   * Optionally update the assigned counter.
   * @returns {{ token: string, staff: object }}
   */
  async staffLogin(staffId, pin, counter) {
    const staffForAuth = staffRepository.findByIdForAuth(staffId);

    const dummyHash = '$2a$10$invalidhashinvalidhashinvalidhashxx';
    const hashToCompare = staffForAuth ? staffForAuth.pinHash : dummyHash;
    const isValid = await bcrypt.compare(pin, hashToCompare);

    if (!staffForAuth || !isValid) {
      auditLogService.log({
        action: 'Failed Staff Login',
        actor: staffId,
        details: 'Incorrect PIN entered',
        type: AUDIT_TYPE.WARNING,
      });
      throw new AppError('Invalid staff ID or PIN', 401, 'INVALID_CREDENTIALS');
    }

    // Update counter and online status if provided
    const updateFields = { isOnline: true };
    if (counter) updateFields.assignedCounter = counter;
    staffRepository.update(staffId, updateFields);

    const staff = staffRepository.findById(staffId);
    const token = issueJWT({ sub: staff.id, role: staff.role, name: staff.name });

    auditLogService.log({
      action: 'Staff Terminal Login',
      actor: `${staff.name} (${staff.assignedCounter})`,
      details: 'Signed in to Staff Terminal',
      type: AUDIT_TYPE.SUCCESS,
    });

    return { token, staff };
  },

  /**
   * Forgot password stub — logs request, no real email in v1.
   */
  async adminForgotPassword(email) {
    const admin = findAdminByEmail(email);
    // Always return success to prevent email enumeration
    if (admin) {
      auditLogService.log({
        action: 'Password Reset Requested',
        actor: email,
        details: 'Admin password reset link requested (stub — no email sent in v1)',
        type: AUDIT_TYPE.INFO,
      });
    }
    return { message: 'If this email exists, a reset link has been sent' };
  },

  /**
   * Get the current authenticated user profile (admin or staff).
   */
  getMe(user) {
    if (user.email) {
      const admin = findAdminByEmail(user.email);
      if (admin) return { id: admin.id, email: admin.email, role: admin.role };
    }
    const staff = staffRepository.findById(user.sub);
    if (staff) return { id: staff.id, name: staff.name, role: staff.role, assignedCounter: staff.assignedCounter };
    throw new AppError('User not found', 404, 'NOT_FOUND');
  },
};

module.exports = authService;
