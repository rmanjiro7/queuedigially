'use strict';

const { setupTestEnv, seedTestData } = require('../fixtures/seed');
setupTestEnv();

const request = require('supertest');

let app;
let db;
let adminToken;
let staffToken;

beforeAll(async () => {
  jest.resetModules();
  db = require('../../src/config/database');
  app = require('../../src/app');
  await seedTestData(db);

  const adminLogin = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminLogin.body.data.token;

  const staffLogin = await request(app)
    .post('/api/v1/auth/staff/login')
    .send({ staffId: 'staff-1', pin: '1234' });
  staffToken = staffLogin.body.data.token;
});

afterAll(() => {
  try { db.close(); } catch { /* already closed */ }
});

describe('Services API', () => {
  test('lists services publicly', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'srv-1', prefix: 'A' }),
    ]));
  });

  test('requires admin authentication to create a service', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .send({ name: 'Payments', prefix: 'P', avgServiceMinutes: 10 });
    expect(res.status).toBe(401);
  });

  test('rejects staff attempts to create a service', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Payments', prefix: 'P', avgServiceMinutes: 10 });
    expect(res.status).toBe(403);
  });

  test('creates a service as an admin', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Payments', prefix: 'P', avgServiceMinutes: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(expect.objectContaining({
      name: 'Payments', prefix: 'P', avgServiceMinutes: 10, isActive: true,
    }));
  });

  test('rejects duplicate prefixes (BR-017)', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another General', prefix: 'A', avgServiceMinutes: 10 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  test('validates service input', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', prefix: 'TOO', avgServiceMinutes: 0 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('updates a service as an admin', async () => {
    const res = await request(app)
      .put('/api/v1/services/srv-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ avgServiceMinutes: 12 });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.objectContaining({
      id: 'srv-1', avgServiceMinutes: 12, isActive: true,
    }));
  });

  test('cannot delete a service with active tokens (BR-018)', async () => {
    await request(app)
      .post('/api/v1/tokens')
      .send({ serviceId: 'srv-1', customerName: 'Queued Customer' });

    const res = await request(app)
      .delete('/api/v1/services/srv-1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });
});
