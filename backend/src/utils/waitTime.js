'use strict';

/**
 * waitTime.js — Wait time estimation utilities.
 *
 * Estimates how long a token will wait based on:
 * - Number of tokens ahead in the same service queue
 * - Average service duration for that service
 * - Priority tier (VIP gets a 0.4x multiplier — faster)
 */

const { PRIORITY } = require('../constants');

/**
 * Calculate estimated wait minutes for a token.
 *
 * @param {object} params
 * @param {number} params.positionInQueue - 1-based position (1 = next)
 * @param {number} params.avgServiceMinutes - Average minutes per customer for this service
 * @param {string} params.priority - Token priority tier
 * @param {number} [params.vipMultiplier] - VIP speed multiplier (default 0.4)
 * @returns {number} Estimated wait in minutes
 */
function estimateWaitMinutes({ positionInQueue, avgServiceMinutes, priority, vipMultiplier = 0.4 }) {
  const base = Math.max(1, positionInQueue) * avgServiceMinutes;
  if (priority === PRIORITY.VIP) {
    return Math.max(2, Math.round(base * vipMultiplier));
  }
  return Math.max(3, base);
}

/**
 * Recalculate wait estimates for all waiting tokens in a service.
 * Returns a map of tokenId → estimatedWaitMinutes.
 *
 * @param {Array} waitingTokens - Sorted waiting tokens for a service (priority order, then FIFO)
 * @param {number} avgServiceMinutes
 * @param {number} [vipMultiplier]
 * @returns {Map<string, number>}
 */
function recalculateWaitTimes(waitingTokens, avgServiceMinutes, vipMultiplier = 0.4) {
  const result = new Map();
  waitingTokens.forEach((token, index) => {
    result.set(
      token.id,
      estimateWaitMinutes({
        positionInQueue: index + 1,
        avgServiceMinutes,
        priority: token.priority,
        vipMultiplier,
      })
    );
  });
  return result;
}

module.exports = { estimateWaitMinutes, recalculateWaitTimes };
