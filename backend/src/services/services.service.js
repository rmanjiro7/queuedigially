'use strict';

const { v4: uuidv4 } = require('uuid');
const serviceRepository = require('../repositories/service.repository');
const auditLogService = require('./auditLog.service');
const { broadcast } = require('../websocket/wsBroadcast');
const { AppError } = require('../middlewares/errorHandler');
const { WS_EVENTS, AUDIT_TYPE } = require('../constants');

const servicesService = {
  getAll() {
    return serviceRepository.findAll();
  },

  getById(id) {
    const service = serviceRepository.findById(id);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');
    return service;
  },

  create(data, actorEmail) {
    // Check prefix uniqueness (BR-017)
    const existing = serviceRepository.findByPrefix(data.prefix);
    if (existing) throw new AppError(`Prefix '${data.prefix}' is already in use`, 409, 'CONFLICT');

    const now = Date.now();
    const service = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      prefix: data.prefix.toUpperCase(),
      avgServiceMinutes: data.avgServiceMinutes,
      icon: data.icon || 'Info',
      color: data.color || 'emerald',
      isActive: data.isActive !== false,
      maxDailyCapacity: data.maxDailyCapacity ?? null,
      priorityWeight: data.priorityWeight || 1,
      createdAt: now,
      updatedAt: now,
    };

    const saved = serviceRepository.insert(service);

    auditLogService.log({
      action: 'Service Created',
      actor: actorEmail || 'Administrator',
      details: `Added service: ${saved.name} (${saved.prefix}-XXX)`,
      type: AUDIT_TYPE.SUCCESS,
    });

    broadcast(WS_EVENTS.SERVICE_UPDATED, saved);
    return saved;
  },

  update(id, data, actorEmail) {
    const existing = serviceRepository.findById(id);
    if (!existing) throw new AppError('Service not found', 404, 'NOT_FOUND');

    // If prefix is being changed, check uniqueness
    if (data.prefix && data.prefix !== existing.prefix) {
      const conflict = serviceRepository.findByPrefix(data.prefix);
      if (conflict) throw new AppError(`Prefix '${data.prefix}' is already in use`, 409, 'CONFLICT');
    }

    const updated = serviceRepository.update(id, data);

    auditLogService.log({
      action: 'Service Updated',
      actor: actorEmail || 'Administrator',
      details: `Updated service: ${updated.name}`,
      type: AUDIT_TYPE.INFO,
    });

    broadcast(WS_EVENTS.SERVICE_UPDATED, updated);
    return updated;
  },

  delete(id, actorEmail) {
    const service = serviceRepository.findById(id);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    // Cannot delete service with active tokens (BR-018)
    if (serviceRepository.hasActiveTokens(id)) {
      throw new AppError(
        'Cannot delete a service with active (waiting/called/serving) tokens',
        409,
        'CONFLICT'
      );
    }

    serviceRepository.delete(id);

    auditLogService.log({
      action: 'Service Deleted',
      actor: actorEmail || 'Administrator',
      details: `Removed service: ${service.name} (${service.prefix}-XXX)`,
      type: AUDIT_TYPE.WARNING,
    });

    broadcast(WS_EVENTS.SERVICE_UPDATED, { deleted: true, id });
  },
};

module.exports = servicesService;
