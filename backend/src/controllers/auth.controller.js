'use strict';

const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const authController = {
  async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.adminLogin(email, password);
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async staffLogin(req, res, next) {
    try {
      const { staffId, pin, counter } = req.body;
      const result = await authService.staffLogin(staffId, pin, counter);
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async adminForgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.adminForgotPassword(email);
      return success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  },

  getMe(req, res, next) {
    try {
      const user = authService.getMe(req.user);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
