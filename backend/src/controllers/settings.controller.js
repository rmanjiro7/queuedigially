'use strict';

const settingsService = require('../services/settings.service');
const { success } = require('../utils/response');

const settingsController = {
  get(req, res, next) {
    try {
      return success(res, settingsService.get());
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const settings = settingsService.update(req.body, req.user?.email);
      return success(res, settings, 'Settings updated');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = settingsController;
