'use strict';

/**
 * tokens.test.js — Integration tests for queue token lifecycle.
 * Covers create, call-next, status transitions, business rules.
 */

const { setupTestEnv, seedTestData } = require('../fixtures/seed');
setupTestEnv();

const request = require('supertest');

let app, db, staffToken, adminToken;

beforeAll(async () => {
  jest.resetModules();
  db  = require('../../src/config/database');
  app = require('../../src/app');
  await seedTestData(db);

  // Login staff and admin
  const staffRes = await request(app)
    .post('/api/v1/auth/staff/login')
    .send({ staffId: 'staff-1', pin: '1234' });
  staffToken = staffRes.body.data.token;

  const adminRes = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminRes.body.data.token;
});

afterAll(() => {
  try { db.close(); } catch { /* already closed */ }
});

// ─── Token Creation (public) ──────────────────────────────────────────────────

describe('POST /api/v1/tokens', () => {
  test('creates a token and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Alice', priority: 'normal' });

    expect(res.status).toBe(201);
    expect(res.body.data.tokenNumber).toMatch(/^A-\d{3}$/);
    expect(res.body.data.status).toBe('waiting');
    expect(res.body.data.customerName).toBe('Alice');
  });

  test('token number format is PREFIX-NNN', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Bob' });

    expect(res.body.data.tokenNumber).toMatch(/^[A-Z]+-\d{3}$/);
  });

  test('returns 404 for non-existent serviceId', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-999', customerName: 'Alice' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  test('returns 409 for inactive service (BR-001)', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-inactive', customerName: 'Alice' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SERVICE_INACTIVE');
  });

  test('returns 422 when customerName is missing', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when customerName is empty', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: '' });

    expect(res.status).toBe(422);
  });

  test('returns 422 for invalid priority value', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Alice', priority: 'ultra' });

    expect(res.status).toBe(422);
  });

  test('accepts optional fields: phone, email, notes', async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({
        serviceId: 'srv-1',
        customerName: 'Charlie',
        customerPhone: '+1 555 000 0000',
        customerEmail: 'charlie@test.com',
        notes: 'Needs accessibility assistance',
        priority: 'priority',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.customerPhone).toBe('+1 555 000 0000');
    expect(res.body.data.customerEmail).toBe('charlie@test.com');
    expect(res.body.data.priority).toBe('priority');
  });
});

// ─── Token Lookup (public) ────────────────────────────────────────────────────

describe('GET /api/v1/tokens/:tokenNumber', () => {
  let tokenNumber;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Dana' });
    tokenNumber = res.body.data.tokenNumber;
  });

  test('returns token by number', async () => {
    const res = await request(app).get(`/api/v1/tokens/${tokenNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.tokenNumber).toBe(tokenNumber);
    expect(res.body.data.customerName).toBe('Dana');
  });

  test('returns 404 for non-existent token number', async () => {
    const res = await request(app).get('/api/v1/tokens/X-999');
    expect(res.status).toBe(404);
  });
});

// ─── Token Listing (staff-authenticated) ─────────────────────────────────────

describe('GET /api/v1/tokens', () => {
  test('returns token list for authenticated staff', async () => {
    const res = await request(app)
      .get('/api/v1/tokens')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/tokens');
    expect(res.status).toBe(401);
  });

  test('filters by status', async () => {
    const res = await request(app)
      .get('/api/v1/tokens?status=waiting')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    res.body.data.data.forEach(t => expect(t.status).toBe('waiting'));
  });
});

// ─── Token Lifecycle: call-next → serve → complete ───────────────────────────

describe('Token lifecycle', () => {
  let calledToken;

  test('POST /tokens/call-next returns a called token', async () => {
    // Ensure there's a waiting token first
    await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Eve' });

    const res = await request(app)
      .post('/api/v1/tokens/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('called');
    expect(res.body.data.counterAssigned).toBe('Counter 01');
    calledToken = res.body.data;
  });

  test('call-next requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/tokens/call-next')
      .send({});
    expect(res.status).toBe(401);
  });

  test('waiting → completed directly is invalid (BR-008) → 409', async () => {
    // Create a fresh waiting token
    const created = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Frank' });

    const res = await request(app)
      .patch(`/api/v1/tokens/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  test('called → serving is valid', async () => {
    if (!calledToken) return;
    const res = await request(app)
      .patch(`/api/v1/tokens/${calledToken.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'serving' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('serving');
    expect(res.body.data.servedAt).not.toBeNull();
    calledToken = res.body.data;
  });

  test('serving → completed is valid', async () => {
    if (!calledToken) return;
    const res = await request(app)
      .patch(`/api/v1/tokens/${calledToken.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).not.toBeNull();
  });

  test('completed → cancelled is invalid (BR-008) → 409', async () => {
    if (!calledToken) return;
    const res = await request(app)
      .patch(`/api/v1/tokens/${calledToken.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });
});

// ─── Skip and Recall ─────────────────────────────────────────────────────────

describe('Skip and recall', () => {
  let skippedToken;

  beforeAll(async () => {
    // Create → call → skip
    await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Grace' });

    const callRes = await request(app)
      .post('/api/v1/tokens/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({});

    const skipRes = await request(app)
      .patch(`/api/v1/tokens/${callRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'skipped' });

    skippedToken = skipRes.body.data;
  });

  test('called → skipped is valid', () => {
    expect(skippedToken.status).toBe('skipped');
  });

  test('skipped token can be recalled', async () => {
    const res = await request(app)
      .post(`/api/v1/tokens/${skippedToken.id}/recall`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('called');
  });
});

// ─── Delay ───────────────────────────────────────────────────────────────────

describe('PATCH /api/v1/tokens/:id/delay', () => {
  let waitingTokenId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Henry' });
    waitingTokenId = res.body.data.id;
  });

  test('adds extra minutes buffer', async () => {
    const before = await request(app).get('/api/v1/tokens/A-001');
    const res = await request(app)
      .patch(`/api/v1/tokens/${waitingTokenId}/delay`)
      .send({ extraMinutes: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toContain('+5m delay');
  });

  test('returns 422 for extraMinutes > 30', async () => {
    const res = await request(app)
      .patch(`/api/v1/tokens/${waitingTokenId}/delay`)
      .send({ extraMinutes: 99 });

    expect(res.status).toBe(422);
  });
});

// ─── Queue capacity (BR-011) ──────────────────────────────────────────────────

describe('Queue capacity enforcement (BR-011)', () => {
  test('returns 409 when global queue is full', async () => {
    // Set maxQueueSize to 0 via DB directly
    db.prepare('UPDATE settings SET max_queue_size = 0 WHERE id = 1').run({});

    const res = await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Overflow' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('QUEUE_FULL');

    // Restore
    db.prepare('UPDATE settings SET max_queue_size = 200 WHERE id = 1').run({});
  });
});
