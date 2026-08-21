'use strict';

const staffService = require('../services/staff.service');
const { success, created, noContent } = require('../utils/response');

const staffController = {
  list(req, res, next) {
    try {
      return success(res, staffService.getAll());
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const member = await staffService.create(req.body, req.user?.email);
      return created(res, member, 'Staff member added');
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const member = await staffService.update(req.params.id, req.body, req.user?.email);
      return success(res, member);
    } catch (err) {
      next(err);
    }
  },

  delete(req, res, next) {
    try {
      staffService.delete(req.params.id, req.user?.email, req.user?.sub);
      return noContent(res);
    } catch (err) {
      next(err);
    }
  },

  updateOnlineStatus(req, res, next) {
    try {
      const member = staffService.updateOnlineStatus(
        req.params.id,
        req.body,
        req.user?.sub,
        req.user?.role
      );
      return success(res, member);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = staffController;
