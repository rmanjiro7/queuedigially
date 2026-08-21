'use strict';

const { v4: uuidv4 } = require('uuid');
const auditLogRepository = require('../repositories/auditLog.repository');
const { AUDIT_TYPE } = require('../constants');

const auditLogService = {
  /**
   * Append an audit log entry.
   * @param {object} params
   * @param {string} params.action
   * @param {string} params.actor
   * @param {string} params.details
   * @param {string} [params.type] - AUDIT_TYPE value
   * @param {string} [params.tokenNumber]
   */
  log({ action, actor, details, type = AUDIT_TYPE.INFO, tokenNumber = null }) {
    auditLogRepository.insert({
      id: uuidv4(),
      timestamp: Date.now(),
      action,
      actor,
      details,
      type,
      tokenNumber,
    });
  },

  getAll({ limit, offset, type } = {}) {
    const data = auditLogRepository.findAll({ limit, offset, type });
    const total = auditLogRepository.count({ type });
    return { data, total };
  },
};

module.exports = auditLogService;
