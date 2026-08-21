'use strict';

const { setupTestEnv } = require('../fixtures/seed');
setupTestEnv();

const { estimateWaitMinutes, recalculateWaitTimes } = require('../../src/utils/waitTime');

describe('waitTime utility', () => {
  describe('estimateWaitMinutes', () => {
    test('normal priority: position 1, avg 8 min → 8 min', () => {
      expect(estimateWaitMinutes({ positionInQueue: 1, avgServiceMinutes: 8, priority: 'normal' })).toBe(8);
    });

    test('normal priority: position 3, avg 8 min → 24 min', () => {
      expect(estimateWaitMinutes({ positionInQueue: 3, avgServiceMinutes: 8, priority: 'normal' })).toBe(24);
    });

    test('VIP priority is faster (0.5x default vipMultiplier)', () => {
      const normal = estimateWaitMinutes({ positionInQueue: 1, avgServiceMinutes: 10, priority: 'normal' });
      const vip    = estimateWaitMinutes({ positionInQueue: 1, avgServiceMinutes: 10, priority: 'vip', vipMultiplier: 0.4 });
      expect(vip).toBeLessThan(normal);
    });

    test('minimum wait for normal is 3 minutes', () => {
      expect(estimateWaitMinutes({ positionInQueue: 0, avgServiceMinutes: 1, priority: 'normal' })).toBe(3);
    });

    test('minimum wait for VIP is 2 minutes', () => {
      expect(estimateWaitMinutes({ positionInQueue: 0, avgServiceMinutes: 1, priority: 'vip', vipMultiplier: 0.4 })).toBe(2);
    });
  });

  describe('recalculateWaitTimes', () => {
    test('returns a map with correct estimates for each token', () => {
      const tokens = [
        { id: 'tok-1', priority: 'vip' },
        { id: 'tok-2', priority: 'normal' },
        { id: 'tok-3', priority: 'normal' },
      ];
      const result = recalculateWaitTimes(tokens, 8, 0.4);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
      expect(result.get('tok-1')).toBeDefined();
      expect(result.get('tok-2')).toBeDefined();
      // Position 2 should wait more than position 1
      expect(result.get('tok-3')).toBeGreaterThanOrEqual(result.get('tok-2'));
    });

    test('returns empty map for empty list', () => {
      expect(recalculateWaitTimes([], 8).size).toBe(0);
    });
  });
});
