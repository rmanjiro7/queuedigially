'use strict';

const tokenRepository = require('../repositories/token.repository');
const serviceRepository = require('../repositories/service.repository');
const staffRepository = require('../repositories/staff.repository');
const { success } = require('../utils/response');

const statsController = {
  get(req, res, next) {
    try {
      const byStatus = tokenRepository.getStatsByStatus();
      const byService = tokenRepository.getStatsByService();
      const avgWaitMs = tokenRepository.getAvgWaitMs();

      const totalToday = Object.values(byStatus).reduce((a, b) => a + b, 0);
      const avgWaitMinutes = avgWaitMs > 0 ? Math.round(avgWaitMs / 60000 * 10) / 10 : 0;

      // Enrich byService with service name
      const services = serviceRepository.findAll();
      const serviceMap = new Map(services.map((s) => [s.id, s.name]));

      const byServiceEnriched = byService.map((row) => ({
        serviceId: row.service_id,
        serviceName: serviceMap.get(row.service_id) || row.service_name,
        total: row.total,
        waiting: row.waiting,
      }));

      // Online staff count
      const allStaff = staffRepository.findAll();
      const onlineStaff = allStaff.filter((s) => s.isOnline).length;

      return success(res, {
        totalToday,
        waiting: byStatus.waiting || 0,
        called: byStatus.called || 0,
        serving: byStatus.serving || 0,
        completed: byStatus.completed || 0,
        skipped: byStatus.skipped || 0,
        cancelled: byStatus.cancelled || 0,
        avgWaitMinutes,
        onlineStaff,
        byService: byServiceEnriched,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = statsController;
