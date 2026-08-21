'use strict';

const queueService = require('../services/queue.service');
const { success, created, noContent } = require('../utils/response');

const tokensController = {
  async create(req, res, next) {
    try {
      const token = await queueService.createToken(req.body);
      return created(res, token, 'Token created');
    } catch (err) {
      next(err);
    }
  },

  list(req, res, next) {
    try {
      const { status, serviceId, date } = req.query;
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
      const result = queueService.listTokens({ status, serviceId, date, limit, offset });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  getByTokenNumber(req, res, next) {
    try {
      const token = queueService.getTokenByNumber(req.params.tokenNumber.toUpperCase());
      return success(res, token);
    } catch (err) {
      next(err);
    }
  },

  callNext(req, res, next) {
    try {
      const staffId = req.user.sub;
      const { serviceIdFilter } = req.body;
      const token = queueService.callNextToken({ staffId, serviceIdFilter });
      if (!token) {
        return success(res, null, 'Queue is empty — no eligible tokens waiting');
      }
      return success(res, token, 'Token called');
    } catch (err) {
      next(err);
    }
  },

  updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const staffId = req.user?.sub || null;
      const token = queueService.updateTokenStatus({ tokenId: id, newStatus: status, staffId });
      return success(res, token);
    } catch (err) {
      next(err);
    }
  },

  recall(req, res, next) {
    try {
      const { id } = req.params;
      const staffId = req.user?.sub || null;
      const token = queueService.recallToken({ tokenId: id, staffId });
      return success(res, token, 'Token recalled');
    } catch (err) {
      next(err);
    }
  },

  delay(req, res, next) {
    try {
      const { id } = req.params;
      const extraMinutes = req.body.extraMinutes || 5;
      const token = queueService.requestDelay({ tokenId: id, extraMinutes });
      return success(res, token, `Added +${extraMinutes} minutes buffer`);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = tokensController;
