'use strict';

const tokenRepository = require('../repositories/token.repository');
const settingsRepository = require('../repositories/settings.repository');
const { TOKEN_STATUS } = require('../constants');
const { success } = require('../utils/response');

const displayController = {
  get(req, res, next) {
    try {
      // Active (called + serving) tokens — for "Now Serving" board
      const activeTokens = tokenRepository.findActive();

      // Up-next waiting list (max 5 for readability — BR-025)
      const waitingTokens = tokenRepository.findAllWaiting().slice(0, 5);

      // Today's completed count
      const byStatus = tokenRepository.getStatsByStatus();

      // Settings for org/venue branding
      const settings = settingsRepository.get();

      // Last called token = the most recently called active token
      const lastCalled = activeTokens
        .filter((t) => t.status === TOKEN_STATUS.CALLED)
        .sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0] || null;

      return success(res, {
        nowServing: activeTokens.slice(0, 10), // BR-025: max 10
        upNext: waitingTokens,
        completedCount: byStatus.completed || 0,
        lastCalledToken: lastCalled,
        settings: {
          organizationName: settings.organizationName,
          venueName: settings.venueName,
          enableSoundAlerts: settings.enableSoundAlerts,
          enableSpeechAnnouncements: settings.enableSpeechAnnouncements,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = displayController;
