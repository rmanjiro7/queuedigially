'use strict';

const { setupTestEnv } = require('../fixtures/seed');

// Set env before any app module loads
setupTestEnv();

describe('tokenNumber utility', () => {
  let generateTokenNumber;
  let db;

  beforeAll(() => {
    jest.resetModules();
    // Re-require after env is set — DB opens :memory:
    db = require('../../src/config/database');
    const now = Date.now();
    db.prepare(`
      INSERT INTO services (id, name, description, prefix, avg_service_minutes, icon, color, is_active, priority_weight, created_at, updated_at)
      VALUES ('srv-1', 'Test', '', 'A', 8, 'Info', 'emerald', 1, 1, $now, $now)
    `).run({ $now: now });
    generateTokenNumber = require('../../src/utils/tokenNumber').generateTokenNumber;
  });

  afterAll(() => {
    db.close();
  });

  test('generates first token as PREFIX-001', () => {
    const num = generateTokenNumber('A');
    expect(num).toBe('A-001');
  });

  test('generates sequential numbers within the day', () => {
    // Insert a fake A-001 token for today
    const now = Date.now();
    db.prepare(`INSERT INTO tokens (id,token_number,service_id,service_name,customer_name,priority,status,joined_at,estimated_wait_minutes,created_at,updated_at) VALUES ($id,$num,'srv-1','Test','Cust','normal','waiting',$now,0,$now,$now)`)
      .run({ $id: 'tok-test-1', $num: 'A-001', $now: now });

    const next = generateTokenNumber('A');
    expect(next).toBe('A-002');
  });

  test('zero-pads to 3 digits', () => {
    // Add 8 more tokens to reach position 10
    const now = Date.now();
    for (let i = 2; i <= 9; i++) {
      db.prepare(`INSERT INTO tokens (id,token_number,service_id,service_name,customer_name,priority,status,joined_at,estimated_wait_minutes,created_at,updated_at) VALUES ($id,$num,'srv-1','Test','Cust','normal','waiting',$now,0,$now,$now)`)
        .run({ $id: `tok-test-${i}`, $num: `A-00${i}`, $now: now });
    }
    const next = generateTokenNumber('A');
    expect(next).toBe('A-010');
  });

  test('different prefix has independent sequence', () => {
    const num = generateTokenNumber('T');
    expect(num).toBe('T-001');
  });

  test('uses uppercase prefix', () => {
    const num = generateTokenNumber('B');
    expect(num).toMatch(/^B-\d{3}$/);
  });
});
