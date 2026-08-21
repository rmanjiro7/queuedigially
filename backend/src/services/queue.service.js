'use strict';

/**
 * queue.service.js — Core queue business logic.
 *
 * All token lifecycle transitions happen here.
 * Business rules from BUSINESS_RULES.md are enforced here.
 * After every mutation, a WS broadcast is triggered.
 */

const { v4: uuidv4 } = require('uuid');
const tokenRepository = require('../repositories/token.repository');
const serviceRepository = require('../repositories/service.repository');
const staffRepository = require('../repositories/staff.repository');
const settingsRepository = require('../repositories/settings.repository');
const auditLogService = require('./auditLog.service');
const { generateTokenNumber } = require('../utils/tokenNumber');
const { estimateWaitMinutes } = require('../utils/waitTime');
const { broadcast } = require('../websocket/wsBroadcast');
const { AppError } = require('../middlewares/errorHandler');
const { TOKEN_STATUS, PRIORITY, VALID_TRANSITIONS, WS_EVENTS, AUDIT_TYPE } = require('../constants');

const queueService = {
  /**
   * Create a new queue token (customer joins queue).
   * Enforces: service active, service capacity, global queue size.
   */
  async createToken({ serviceId, customerName, customerPhone, customerEmail, notes, priority }) {
    const service = serviceRepository.findById(serviceId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');
    if (!service.isActive) throw new AppError('This service is currently unavailable', 409, 'SERVICE_INACTIVE');

    // Global queue size check (BR-011)
    const settings = settingsRepository.get();
    const activeCount = tokenRepository.countActiveToday();
    if (activeCount >= settings.maxQueueSize) {
      throw new AppError('Queue is at full capacity, please try again later', 409, 'QUEUE_FULL');
    }

    // Per-service daily capacity check (BR-002)
    if (service.maxDailyCapacity) {
      const serviceCount = tokenRepository.countForServiceToday(serviceId);
      if (serviceCount >= service.maxDailyCapacity) {
        throw new AppError(`${service.name} has reached its daily capacity`, 409, 'CAPACITY_REACHED');
      }
    }

    // Calculate estimated wait time
    const waitingForService = tokenRepository.findWaitingByService(serviceId);
    const positionInQueue = waitingForService.length + 1;
    const estimatedWaitMinutes = estimateWaitMinutes({
      positionInQueue,
      avgServiceMinutes: service.avgServiceMinutes,
      priority,
      vipMultiplier: 1 / (settings.vipPriorityMultiplier || 2),
    });

    const now = Date.now();
    const tokenNumber = generateTokenNumber(service.prefix);

    const token = {
      id: uuidv4(),
      tokenNumber,
      serviceId: service.id,
      serviceName: service.name,
      customerName: customerName.trim() || `Customer ${tokenNumber}`,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      notes: notes || null,
      priority: priority || PRIORITY.NORMAL,
      status: TOKEN_STATUS.WAITING,
      joinedAt: now,
      calledAt: null,
      servedAt: null,
      completedAt: null,
      counterAssigned: null,
      staffAssignedId: null,
      staffAssignedName: null,
      estimatedWaitMinutes,
      createdAt: now,
      updatedAt: now,
    };

    const saved = tokenRepository.insert(token);

    auditLogService.log({
      action: 'Token Generated',
      actor: 'Customer Self-Service',
      details: `Generated Token ${tokenNumber} for ${token.customerName} (${service.name})`,
      type: AUDIT_TYPE.SUCCESS,
      tokenNumber,
    });

    broadcast(WS_EVENTS.TOKEN_CREATED, saved);
    return saved;
  },

  /**
   * Call the next eligible waiting token for a staff member.
   * Respects staff service assignments and priority ordering.
   * Returns null if no eligible tokens are waiting.
   */
  callNextToken({ staffId, serviceIdFilter }) {
    const staffMember = staffRepository.findById(staffId);
    if (!staffMember) throw new AppError('Staff member not found', 404, 'NOT_FOUND');

    // Determine eligible service IDs for this staff
    let eligibleServiceIds = null;
    if (serviceIdFilter) {
      eligibleServiceIds = [serviceIdFilter];
    } else if (staffMember.assignedServiceIds && staffMember.assignedServiceIds.length > 0) {
      eligibleServiceIds = staffMember.assignedServiceIds;
    }

    // Get waiting tokens (sorted: VIP → Priority → Normal, then FIFO)
    const waitingTokens = tokenRepository.findAllWaiting(eligibleServiceIds);
    if (waitingTokens.length === 0) return null;

    const nextToken = waitingTokens[0];
    const now = Date.now();

    const updated = tokenRepository.update(nextToken.id, {
      status: TOKEN_STATUS.CALLED,
      calledAt: now,
      counterAssigned: staffMember.assignedCounter,
      staffAssignedId: staffMember.id,
      staffAssignedName: staffMember.name,
      estimatedWaitMinutes: 0,
    });

    auditLogService.log({
      action: 'Called Next Customer',
      actor: `${staffMember.name} (${staffMember.assignedCounter})`,
      details: `Called Token ${updated.tokenNumber} (${updated.customerName})`,
      type: AUDIT_TYPE.INFO,
      tokenNumber: updated.tokenNumber,
    });

    broadcast(WS_EVENTS.TOKEN_CALLED, updated);
    return updated;
  },

  /**
   * Update a token's status (serving, completed, skipped, cancelled).
   * Validates transition against VALID_TRANSITIONS map (BR-008).
   */
  updateTokenStatus({ tokenId, newStatus, staffId }) {
    const token = tokenRepository.findById(tokenId);
    if (!token) throw new AppError('Token not found', 404, 'NOT_FOUND');

    const allowed = VALID_TRANSITIONS[token.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition token from '${token.status}' to '${newStatus}'`,
        409,
        'INVALID_TRANSITION'
      );
    }

    const now = Date.now();
    const updateFields = { status: newStatus };

    if (newStatus === TOKEN_STATUS.SERVING) {
      updateFields.servedAt = now;
      if (staffId) {
        const staffMember = staffRepository.findById(staffId);
        if (staffMember) {
          updateFields.staffAssignedId = staffMember.id;
          updateFields.staffAssignedName = staffMember.name;
          updateFields.counterAssigned = staffMember.assignedCounter;
        }
      }
    } else if (newStatus === TOKEN_STATUS.COMPLETED) {
      updateFields.completedAt = now;
      // Increment staff's served count (BR-014)
      const assignedStaffId = staffId || token.staffAssignedId;
      if (assignedStaffId) staffRepository.incrementServedCount(assignedStaffId);
    }

    const updated = tokenRepository.update(tokenId, updateFields);

    const eventMap = {
      [TOKEN_STATUS.SERVING]:   WS_EVENTS.TOKEN_SERVING,
      [TOKEN_STATUS.COMPLETED]: WS_EVENTS.TOKEN_COMPLETED,
      [TOKEN_STATUS.SKIPPED]:   WS_EVENTS.TOKEN_SKIPPED,
      [TOKEN_STATUS.CANCELLED]: WS_EVENTS.TOKEN_CANCELLED,
    };

    const actorLabel = staffId
      ? (() => { const s = staffRepository.findById(staffId); return s ? `${s.name} (${s.assignedCounter})` : 'Staff'; })()
      : 'Customer';

    const actionMap = {
      [TOKEN_STATUS.SERVING]:   'Customer Arrived at Counter',
      [TOKEN_STATUS.COMPLETED]: 'Service Completed',
      [TOKEN_STATUS.SKIPPED]:   'Customer Skipped (No-Show)',
      [TOKEN_STATUS.CANCELLED]: 'Token Cancelled',
    };

    auditLogService.log({
      action: actionMap[newStatus] || `Token ${newStatus}`,
      actor: actorLabel,
      details: `Token ${token.tokenNumber} (${token.customerName}) → ${newStatus}`,
      type: newStatus === TOKEN_STATUS.COMPLETED ? AUDIT_TYPE.SUCCESS
          : newStatus === TOKEN_STATUS.SKIPPED ? AUDIT_TYPE.WARNING
          : AUDIT_TYPE.INFO,
      tokenNumber: token.tokenNumber,
    });

    broadcast(eventMap[newStatus] || WS_EVENTS.TOKEN_CANCELLED, updated);
    return updated;
  },

  /**
   * Recall a skipped token — puts it back to 'called' state.
   */
  recallToken({ tokenId, staffId }) {
    const token = tokenRepository.findById(tokenId);
    if (!token) throw new AppError('Token not found', 404, 'NOT_FOUND');

    if (token.status !== TOKEN_STATUS.SKIPPED) {
      throw new AppError('Only skipped tokens can be recalled', 409, 'INVALID_TRANSITION');
    }

    const staffMember = staffId ? staffRepository.findById(staffId) : null;
    const now = Date.now();

    const updated = tokenRepository.update(tokenId, {
      status: TOKEN_STATUS.CALLED,
      calledAt: now,
      counterAssigned: staffMember?.assignedCounter || token.counterAssigned,
      staffAssignedId: staffMember?.id || token.staffAssignedId,
      staffAssignedName: staffMember?.name || token.staffAssignedName,
      estimatedWaitMinutes: 0,
    });

    auditLogService.log({
      action: 'Recalled Customer',
      actor: staffMember ? staffMember.name : 'Staff',
      details: `Recalled Token ${token.tokenNumber} (${token.customerName})`,
      type: AUDIT_TYPE.INFO,
      tokenNumber: token.tokenNumber,
    });

    broadcast(WS_EVENTS.TOKEN_RECALLED, updated);
    return updated;
  },

  /**
   * Add extra wait time buffer to a token (customer running late).
   */
  requestDelay({ tokenId, extraMinutes }) {
    const token = tokenRepository.findById(tokenId);
    if (!token) throw new AppError('Token not found', 404, 'NOT_FOUND');

    const allowedStatuses = [TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED];
    if (!allowedStatuses.includes(token.status)) {
      throw new AppError('Delay can only be requested for waiting or called tokens', 409, 'INVALID_TRANSITION');
    }

    const extra = extraMinutes || 5;
    const newEstimate = (token.estimatedWaitMinutes || 5) + extra;
    const newNotes = token.notes ? `${token.notes} | +${extra}m delay requested` : `+${extra}m delay requested`;

    const updated = tokenRepository.update(tokenId, {
      estimatedWaitMinutes: newEstimate,
      notes: newNotes,
    });

    auditLogService.log({
      action: 'Delay Requested',
      actor: 'Customer',
      details: `Added +${extra} minute buffer for token ${token.tokenNumber}`,
      type: AUDIT_TYPE.INFO,
      tokenNumber: token.tokenNumber,
    });

    broadcast(WS_EVENTS.TOKEN_DELAYED, updated);
    return updated;
  },

  getTokenById(id) {
    const token = tokenRepository.findById(id);
    if (!token) throw new AppError('Token not found', 404, 'NOT_FOUND');
    return token;
  },

  getTokenByNumber(tokenNumber) {
    const token = tokenRepository.findByTokenNumber(tokenNumber);
    if (!token) throw new AppError('Token not found', 404, 'NOT_FOUND');
    return token;
  },

  listTokens(filters) {
    const data = tokenRepository.findAll(filters);
    const total = tokenRepository.count(filters);
    return { data, total };
  },
};

module.exports = queueService;
