'use strict';

/**
 * auth.test.js — Integration tests for authentication endpoints.
 * Uses in-memory SQLite so the real DB is never touched.
 */

const { setupTestEnv, seedTestData } = require('../fixtures/seed');
setupTestEnv(); // Must run before any app require

const request = require('supertest');

let app, db;

beforeAll(async () => {
  jest.resetModules();
  db  = require('../../src/config/database');
  app = require('../../src/app');
  await seedTestData(db);
});

afterAll(() => {
  try { db.close(); } catch { /* already closed */ }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/admin/login', () => {
  test('returns 200 + JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.admin.email).toBe('admin@test.com');
    expect(res.body.data.admin.role).toBe('admin');
  });

  test('never returns password_hash in response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    expect(JSON.stringify(res.body)).not.toContain('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'nobody@test.com', password: 'admin123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 422 on missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ password: 'admin123' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns 422 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'not-an-email', password: 'admin123' });

    expect(res.status).toBe(422);
  });
});

// ─── Staff Login ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/staff/login', () => {
  test('returns 200 + JWT on valid PIN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.staff.name).toBe('Test Operator');
    expect(res.body.data.staff.role).toBe('operator');
  });

  test('never returns pin_hash in response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: '1234' });

    expect(JSON.stringify(res.body)).not.toContain('pin_hash');
    expect(JSON.stringify(res.body)).not.toContain('pinHash');
  });

  test('returns 401 on wrong PIN', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: '0000' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('returns 401 on unknown staffId', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'nonexistent', pin: '1234' });

    expect(res.status).toBe(401);
  });

  test('returns 422 when PIN is not 4 digits', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: '123' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when PIN is non-numeric', async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: 'abcd' });

    expect(res.status).toBe(422);
  });
});

// ─── Auth/Me ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  let adminToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = res.body.data.token;
  });

  test('returns 200 with user profile for valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@test.com');
  });

  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});

// ─── Authorization guard ──────────────────────────────────────────────────────

describe('Role-based authorization', () => {
  let staffToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ staffId: 'staff-1', pin: '1234' });
    staffToken = res.body.data.token;
  });

  test('staff token cannot access admin-only /audit-logs → 403', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('staff token cannot access /stats → 403', async () => {
    const res = await request(app)
      .get('/api/v1/stats')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });

  test('staff token cannot POST /services → 403', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Test', prefix: 'X', avgServiceMinutes: 5 });

    expect(res.status).toBe(403);
  });
});
