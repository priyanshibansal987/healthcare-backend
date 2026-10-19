import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { cleanDatabase, disconnectDatabase } from './helpers/testDb.js';

describe('Patient Management Module Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  beforeEach(async () => {
    await cleanDatabase();

    // Register User 1
    const regRes1 = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!'
      });
    user1Id = regRes1.body.data.user.id;

    const loginRes1 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'user1@example.com',
        password: 'Password123!'
      });
    user1Token = loginRes1.body.data.token;

    // Register User 2
    const regRes2 = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123!'
      });
    user2Id = regRes2.body.data.user.id;

    const loginRes2 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'user2@example.com',
        password: 'Password123!'
      });
    user2Token = loginRes2.body.data.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/patients/', () => {
    it('should create a new patient when authenticated', async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'John Doe',
          dateOfBirth: '1990-05-15',
          gender: 'Male',
          email: 'johndoe@example.com',
          phone: '9876543210',
          address: '123 Health Ave, City'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.userId).toBe(user1Id);
    });

    it('should prevent mass assignment: ignoring forged userId in payload', async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Forged Patient',
          dateOfBirth: '1995-01-01',
          gender: 'Female',
          userId: user2Id // Attempting to forge ownership to User 2
        });

      expect(res.statusCode).toBe(201);
      // Must be assigned to authenticated user (user1), not forged user2
      expect(res.body.data.userId).toBe(user1Id);
    });

    it('should reject patient creation without token with 401', async () => {
      const res = await request(app)
        .post('/api/patients/')
        .send({
          name: 'Unauthorized Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid payload (missing name and invalid dateOfBirth)', async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          dateOfBirth: 'invalid-date',
          gender: 'Male'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
      expect(res.body.errors.some((e) => e.field === 'dateOfBirth')).toBe(true);
    });
  });

  describe('GET /api/patients/', () => {
    it('should return only patients owned by the authenticated user', async () => {
      // Create patient for user1
      await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Patient User1',
          dateOfBirth: '1985-02-10',
          gender: 'Male'
        });

      // Create patient for user2
      await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Patient User2',
          dateOfBirth: '1988-08-20',
          gender: 'Female'
        });

      // Request as User 1
      const res1 = await request(app)
        .get('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].name).toBe('Patient User1');
      expect(res1.body.data[0].userId).toBe(user1Id);

      // Request as User 2
      const res2 = await request(app)
        .get('/api/patients/')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].name).toBe('Patient User2');
      expect(res2.body.data[0].userId).toBe(user2Id);
    });
  });

  describe('GET /api/patients/:id/', () => {
    let patient1;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Alice Smith',
          dateOfBirth: '1992-03-12',
          gender: 'Female'
        });
      patient1 = res.body.data;
    });

    it('should retrieve patient by ID when owned by user', async () => {
      const res = await request(app)
        .get(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(patient1.id);
      expect(res.body.data.name).toBe('Alice Smith');
    });

    it('should reject access to another user\'s patient with 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Patient not found');
    });

    it('should reject malformed UUID with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/patients/not-a-valid-uuid/')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/patients/:id/', () => {
    let patient1;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Bob Original',
          dateOfBirth: '1990-01-01',
          gender: 'Male'
        });
      patient1 = res.body.data;
    });

    it('should update patient details when owned by current user', async () => {
      const res = await request(app)
        .put(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Bob Updated',
          phone: '1122334455'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Bob Updated');
      expect(res.body.data.phone).toBe('1122334455');
    });

    it('should prevent cross-user update with 404', async () => {
      const res = await request(app)
        .put(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Hacked Name'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Patient not found');

      // Verify record was untouched in database
      const dbRecord = await prisma.patient.findUnique({
        where: { id: patient1.id }
      });
      expect(dbRecord.name).toBe('Bob Original');
    });
  });

  describe('DELETE /api/patients/:id/', () => {
    let patient1;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Charlie to Delete',
          dateOfBirth: '1980-07-22',
          gender: 'Male'
        });
      patient1 = res.body.data;
    });

    it('should prevent cross-user deletion with 404', async () => {
      const res = await request(app)
        .delete(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);

      // Verify record still exists
      const dbRecord = await prisma.patient.findUnique({
        where: { id: patient1.id }
      });
      expect(dbRecord).not.toBeNull();
    });

    it('should delete patient when owned by current user', async () => {
      const res = await request(app)
        .delete(`/api/patients/${patient1.id}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Confirm record is deleted in database
      const dbRecord = await prisma.patient.findUnique({
        where: { id: patient1.id }
      });
      expect(dbRecord).toBeNull();
    });
  });
});
