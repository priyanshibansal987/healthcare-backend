import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { cleanDatabase, disconnectDatabase } from './helpers/testDb.js';

describe('Doctor Management Module Tests', () => {
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
        name: 'Doctor Creator 1',
        email: 'creator1@example.com',
        password: 'Password123!'
      });
    user1Id = regRes1.body.data.user.id;

    const loginRes1 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'creator1@example.com',
        password: 'Password123!'
      });
    user1Token = loginRes1.body.data.token;

    // Register User 2
    const regRes2 = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'Doctor Creator 2',
        email: 'creator2@example.com',
        password: 'Password123!'
      });
    user2Id = regRes2.body.data.user.id;

    const loginRes2 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'creator2@example.com',
        password: 'Password123!'
      });
    user2Token = loginRes2.body.data.token;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/doctors/', () => {
    it('should create a doctor successfully with 201 Created', async () => {
      const res = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. Gregory House',
          email: 'house@princetonplainsboro.com',
          phone: '1234567890',
          specialization: 'Diagnostic Medicine'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Gregory House');
      expect(res.body.data.email).toBe('house@princetonplainsboro.com');
      expect(res.body.data.createdById).toBe(user1Id);
    });

    it('should reject doctor creation without token with 401', async () => {
      const res = await request(app)
        .post('/api/doctors/')
        .send({
          name: 'Dr. No Token',
          email: 'notoken@example.com',
          phone: '1234567890',
          specialization: 'General'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate doctor email with 409 Conflict', async () => {
      // First doctor
      await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. Original',
          email: 'duplicate.doctor@example.com',
          phone: '1234567890',
          specialization: 'Cardiology'
        });

      // Second doctor with same email
      const res = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Dr. Duplicate',
          email: 'DUPLICATE.DOCTOR@example.com',
          phone: '9876543210',
          specialization: 'Neurology'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Doctor with this email already exists');
    });

    it('should reject invalid input fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: '',
          email: 'invalid-email',
          phone: '12',
          specialization: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/doctors/', () => {
    it('should list all doctors registered in the system', async () => {
      await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. Alice',
          email: 'alice@hospital.com',
          phone: '1111111111',
          specialization: 'Pediatrics'
        });

      await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Dr. Bob',
          email: 'bob@hospital.com',
          phone: '2222222222',
          specialization: 'Orthopedics'
        });

      const res = await request(app)
        .get('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/doctors/:id/', () => {
    it('should retrieve a single doctor by valid ID', async () => {
      const createRes = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. John Watson',
          email: 'watson@bakerstreet.com',
          phone: '9998887776',
          specialization: 'General Practice'
        });
      const doctorId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(doctorId);
      expect(res.body.data.name).toBe('Dr. John Watson');
    });

    it('should return 404 for nonexistent doctor ID', async () => {
      const res = await request(app)
        .get('/api/doctors/00000000-0000-0000-0000-000000000000/')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Doctor not found');
    });
  });

  describe('PUT /api/doctors/:id/', () => {
    let doctorId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. Stephen Strange',
          email: 'strange@sanctum.com',
          phone: '4445556667',
          specialization: 'Neurosurgery'
        });
      doctorId = createRes.body.data.id;
    });

    it('should update doctor details when requested by creator', async () => {
      const res = await request(app)
        .put(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          specialization: 'Mystic Neurosurgeon',
          phone: '7778889990'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.specialization).toBe('Mystic Neurosurgeon');
      expect(res.body.data.phone).toBe('7778889990');
    });

    it('should reject doctor update by non-creator with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Dr. Hijacked'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You do not have permission to modify this doctor');
    });
  });

  describe('DELETE /api/doctors/:id/', () => {
    let doctorId;
    let patientId;

    beforeEach(async () => {
      const createDoctorRes = await request(app)
        .post('/api/doctors/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Dr. Meredith Grey',
          email: 'grey@seattlegrace.com',
          phone: '5556667778',
          specialization: 'General Surgery'
        });
      doctorId = createDoctorRes.body.data.id;

      const createPatientRes = await request(app)
        .post('/api/patients/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Patient Derek',
          dateOfBirth: '1985-05-10',
          gender: 'Male'
        });
      patientId = createPatientRes.body.data.id;
    });

    it('should reject doctor deletion by non-creator with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You do not have permission to delete this doctor');
    });

    it('should reject doctor deletion with 409 Conflict when active mappings exist', async () => {
      // Create patient-doctor mapping in database
      await prisma.patientDoctorMapping.create({
        data: {
          patientId,
          doctorId
        }
      });

      const res = await request(app)
        .delete(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('active patient assignments');

      // Verify doctor still exists in database
      const dbDoctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      });
      expect(dbDoctor).not.toBeNull();
    });

    it('should successfully delete doctor when creator and no active mappings exist', async () => {
      const res = await request(app)
        .delete(`/api/doctors/${doctorId}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify doctor is removed from database
      const dbDoctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      });
      expect(dbDoctor).toBeNull();
    });
  });
});
