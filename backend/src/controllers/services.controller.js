'use strict';

const servicesService = require('../services/services.service');
const { success, created, noContent } = require('../utils/response');

const servicesController = {
  list(req, res, next) {
    try {
      return success(res, servicesService.getAll());
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const service = servicesService.create(req.body, req.user?.email);
      return created(res, service, 'Service created');
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const service = servicesService.update(req.params.id, req.body, req.user?.email);
      return success(res, service);
    } catch (err) {
      next(err);
    }
  },

  delete(req, res, next) {
    try {
      servicesService.delete(req.params.id, req.user?.email);
      return noContent(res);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = servicesController;
