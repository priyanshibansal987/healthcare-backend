import request from 'supertest';
import app from '../src/app.js';
import { cleanDatabase, disconnectDatabase } from './helpers/testDb.js';

describe('Security & Edge Cases Module Tests', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  it('should return 404 with standard JSON format for unknown routes', async () => {
    const res = await request(app).get('/api/undefined-endpoint-path');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found');
  });

  it('should return 400 for malformed JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/auth/login/')
      .set('Content-Type', 'application/json')
      .send('{"email": "test@example.com", "password": invalid_json_here}');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid JSON payload received');
  });

  it('should provide standard formatted validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'A', // too short
        email: 'invalid-email',
        password: '1' // too short
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBe(3);
  });

  it('should respond with healthy status on health check endpoint', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy and operational');
  });
});
