'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const staffRepository = require('../repositories/staff.repository');
const auditLogService = require('./auditLog.service');
const { broadcast } = require('../websocket/wsBroadcast');
const { AppError } = require('../middlewares/errorHandler');
const { WS_EVENTS, AUDIT_TYPE } = require('../constants');

const staffService = {
  getAll() {
    return staffRepository.findAll();
  },

  getById(id) {
    const member = staffRepository.findById(id);
    if (!member) throw new AppError('Staff member not found', 404, 'NOT_FOUND');
    return member;
  },

  async create(data, actorEmail) {
    // Check email uniqueness
    const existing = staffRepository.findByEmail(data.email);
    if (existing) throw new AppError('A staff member with this email already exists', 409, 'CONFLICT');

    const pinHash = await bcrypt.hash(data.pin, 10);
    const now = Date.now();

    const member = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      role: data.role,
      assignedCounter: data.assignedCounter,
      assignedServiceIds: data.assignedServiceIds || [],
      pinHash,
      isOnline: false,
      avatarUrl: data.avatarUrl || null,
      servedTodayCount: 0,
      avgHandlingMinutes: 8.0,
      createdAt: now,
      updatedAt: now,
    };

    const saved = staffRepository.insert(member);

    auditLogService.log({
      action: 'Staff Added',
      actor: actorEmail || 'Administrator',
      details: `Added staff member: ${saved.name} (${saved.role}) at ${saved.assignedCounter}`,
      type: AUDIT_TYPE.SUCCESS,
    });

    broadcast(WS_EVENTS.STAFF_UPDATED, saved);
    return saved;
  },

  async update(id, data, actorEmail) {
    const existing = staffRepository.findById(id);
    if (!existing) throw new AppError('Staff member not found', 404, 'NOT_FOUND');

    // Check email uniqueness if changing
    if (data.email && data.email !== existing.email) {
      const conflict = staffRepository.findByEmail(data.email);
      if (conflict) throw new AppError('Email already in use by another staff member', 409, 'CONFLICT');
    }

    const updateFields = { ...data };

    // Re-hash PIN if provided
    if (data.pin) {
      updateFields.pinHash = await bcrypt.hash(data.pin, 10);
      delete updateFields.pin;
    }

    const updated = staffRepository.update(id, updateFields);

    auditLogService.log({
      action: 'Staff Updated',
      actor: actorEmail || 'Administrator',
      details: `Updated staff profile: ${updated.name}`,
      type: AUDIT_TYPE.INFO,
    });

    broadcast(WS_EVENTS.STAFF_UPDATED, updated);
    return updated;
  },

  delete(id, actorEmail, requestingUserId) {
    const member = staffRepository.findById(id);
    if (!member) throw new AppError('Staff member not found', 404, 'NOT_FOUND');

    // A staff member cannot delete themselves (BR-016)
    if (id === requestingUserId) {
      throw new AppError('You cannot delete your own account', 409, 'CONFLICT');
    }

    staffRepository.delete(id);

    auditLogService.log({
      action: 'Staff Removed',
      actor: actorEmail || 'Administrator',
      details: `Removed staff member: ${member.name}`,
      type: AUDIT_TYPE.WARNING,
    });

    broadcast(WS_EVENTS.STAFF_UPDATED, { deleted: true, id });
  },

  updateOnlineStatus(id, { isOnline, assignedCounter }, requestingUserId, requestingRole) {
    const member = staffRepository.findById(id);
    if (!member) throw new AppError('Staff member not found', 404, 'NOT_FOUND');

    // Staff can only update their own status; admin can update anyone's
    if (requestingRole !== 'admin' && requestingRole !== 'supervisor' && id !== requestingUserId) {
      throw new AppError('You can only update your own online status', 403, 'FORBIDDEN');
    }

    const updateFields = { isOnline };
    if (assignedCounter) updateFields.assignedCounter = assignedCounter;

    const updated = staffRepository.update(id, updateFields);
    broadcast(WS_EVENTS.STAFF_UPDATED, updated);
    return updated;
  },
};

module.exports = staffService;
