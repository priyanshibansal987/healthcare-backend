import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { cleanDatabase, disconnectDatabase } from './helpers/testDb.js';

describe('Authentication Module Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/auth/register/', () => {
    it('should register a valid user successfully with 201 Created', async () => {
      const res = await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'Priyanshi Bansal',
          email: 'priyanshi@example.com',
          password: 'securePassword123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.name).toBe('Priyanshi Bansal');
      expect(res.body.data.user.email).toBe('priyanshi@example.com');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify user was created in the database and password is truly hashed
      const dbUser = await prisma.user.findUnique({
        where: { email: 'priyanshi@example.com' }
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.passwordHash).not.toBe('securePassword123');
      expect(dbUser.passwordHash.startsWith('$2')).toBe(true);
    });

    it('should reject registration when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register/')
        .send({
          email: 'noname@example.com',
          password: 'securePassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'securePassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should reject registration when password is missing or too short', async () => {
      const res = await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'Short Password User',
          email: 'shortpass@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'User One',
          email: 'duplicate@example.com',
          password: 'securePassword123'
        });

      // Duplicate registration attempt with different casing
      const res = await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'User Two',
          email: 'DUPLICATE@example.com',
          password: 'anotherPassword123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email is already registered');
    });
  });

  describe('POST /api/auth/login/', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register/')
        .send({
          name: 'Login Test User',
          email: 'login@example.com',
          password: 'correctPassword123'
        });
    });

    it('should successfully log in and return JWT token and safe user info', async () => {
      const res = await request(app)
        .post('/api/auth/login/')
        .send({
          email: 'login@example.com',
          password: 'correctPassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login/')
        .send({
          email: 'login@example.com',
          password: 'wrongPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject nonexistent user login with generic 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login/')
        .send({
          email: 'nonexistent@example.com',
          password: 'somePassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject malformed or missing email in login', async () => {
      const res = await request(app)
        .post('/api/auth/login/')
        .send({
          email: 'not-an-email',
          password: 'correctPassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });
  });
});
