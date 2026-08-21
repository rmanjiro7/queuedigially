'use strict';

const auditLogService = require('../services/auditLog.service');
const { success } = require('../utils/response');

const auditLogsController = {
  list(req, res, next) {
    try {
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
      const { type } = req.query;
      const result = auditLogService.getAll({ limit, offset, type });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = auditLogsController;
