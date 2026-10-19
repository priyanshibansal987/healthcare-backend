import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { cleanDatabase, disconnectDatabase } from './helpers/testDb.js';

describe('Patient-Doctor Mapping Module Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  let patientUser1;
  let patientUser2;
  let doctor1;
  let doctor2;

  beforeEach(async () => {
    await cleanDatabase();

    // Register & login User 1
    const regRes1 = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'User One',
        email: 'user1.mapping@example.com',
        password: 'Password123!'
      });
    user1Id = regRes1.body.data.user.id;

    const loginRes1 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'user1.mapping@example.com',
        password: 'Password123!'
      });
    user1Token = loginRes1.body.data.token;

    // Register & login User 2
    const regRes2 = await request(app)
      .post('/api/auth/register/')
      .send({
        name: 'User Two',
        email: 'user2.mapping@example.com',
        password: 'Password123!'
      });
    user2Id = regRes2.body.data.user.id;

    const loginRes2 = await request(app)
      .post('/api/auth/login/')
      .send({
        email: 'user2.mapping@example.com',
        password: 'Password123!'
      });
    user2Token = loginRes2.body.data.token;

    // Create Patient for User 1
    const patientRes1 = await request(app)
      .post('/api/patients/')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Patient Alpha',
        dateOfBirth: '1991-04-10',
        gender: 'Male'
      });
    patientUser1 = patientRes1.body.data;

    // Create Patient for User 2
    const patientRes2 = await request(app)
      .post('/api/patients/')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Patient Beta',
        dateOfBirth: '1993-08-15',
        gender: 'Female'
      });
    patientUser2 = patientRes2.body.data;

    // Create Doctors
    const docRes1 = await request(app)
      .post('/api/doctors/')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Dr. Sarah Connor',
        email: 'sarah.connor@hospital.org',
        phone: '1122334455',
        specialization: 'Trauma Surgery'
      });
    doctor1 = docRes1.body.data;

    const docRes2 = await request(app)
      .post('/api/doctors/')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Dr. Leonard McCoy',
        email: 'mccoy@enterprise.org',
        phone: '9988776655',
        specialization: 'Exobiology'
      });
    doctor2 = docRes2.body.data;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  describe('POST /api/mappings/', () => {
    it('should assign a doctor to an owned patient with 201 Created', async () => {
      const res = await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Doctor assigned to patient successfully');
      expect(res.body.data.patientId).toBe(patientUser1.id);
      expect(res.body.data.doctorId).toBe(doctor1.id);
      expect(res.body.data.doctor.name).toBe('Dr. Sarah Connor');
    });

    it('should reject mapping creation without token with 401', async () => {
      const res = await request(app)
        .post('/api/mappings/')
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject mapping when assigning to another user\'s patient with 404', async () => {
      // User 1 attempts to assign doctor to User 2's patient
      const res = await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser2.id,
          doctorId: doctor1.id
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Patient not found');
    });

    it('should reject mapping when doctor does not exist with 404', async () => {
      const res = await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: '00000000-0000-0000-0000-000000000000'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Doctor not found');
    });

    it('should reject duplicate assignments with 409 Conflict', async () => {
      // First assignment
      await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      // Second duplicate assignment
      const res = await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Doctor is already assigned to this patient');
    });
  });

  describe('GET /api/mappings/', () => {
    it('should list only mappings belonging to the authenticated user\'s patients', async () => {
      // Assign doctor1 to patientUser1 (User 1)
      await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      // Assign doctor2 to patientUser2 (User 2)
      await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          patientId: patientUser2.id,
          doctorId: doctor2.id
        });

      // Query as User 1
      const res1 = await request(app)
        .get('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].patientId).toBe(patientUser1.id);
      expect(res1.body.data[0].doctorId).toBe(doctor1.id);

      // Query as User 2
      const res2 = await request(app)
        .get('/api/mappings/')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].patientId).toBe(patientUser2.id);
      expect(res2.body.data[0].doctorId).toBe(doctor2.id);
    });
  });

  describe('GET /api/mappings/:patient_id/', () => {
    it('should return all doctors assigned to a patient owned by current user', async () => {
      // Assign both doctor1 and doctor2 to patientUser1
      await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });

      await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor2.id
        });

      const res = await request(app)
        .get(`/api/mappings/${patientUser1.id}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.patient.id).toBe(patientUser1.id);
      expect(res.body.data.assignedDoctors.length).toBe(2);
      expect(res.body.data.assignedDoctors.some((d) => d.name === 'Dr. Sarah Connor')).toBe(true);
      expect(res.body.data.assignedDoctors.some((d) => d.name === 'Dr. Leonard McCoy')).toBe(true);
    });

    it('should reject retrieval for another user\'s patient with 404', async () => {
      const res = await request(app)
        .get(`/api/mappings/${patientUser2.id}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Patient not found');
    });
  });

  describe('DELETE /api/mappings/:id/', () => {
    let mappingId;

    beforeEach(async () => {
      const mapRes = await request(app)
        .post('/api/mappings/')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          patientId: patientUser1.id,
          doctorId: doctor1.id
        });
      mappingId = mapRes.body.data.id;
    });

    it('should prevent cross-user mapping deletion with 404', async () => {
      const res = await request(app)
        .delete(`/api/mappings/${mappingId}/`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Mapping not found');

      // Verify mapping still exists in database
      const dbMapping = await prisma.patientDoctorMapping.findUnique({
        where: { id: mappingId }
      });
      expect(dbMapping).not.toBeNull();
    });

    it('should delete mapping and verify patient and doctor remain untouched', async () => {
      const res = await request(app)
        .delete(`/api/mappings/${mappingId}/`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify mapping is deleted
      const dbMapping = await prisma.patientDoctorMapping.findUnique({
        where: { id: mappingId }
      });
      expect(dbMapping).toBeNull();

      // Verify patient still exists
      const dbPatient = await prisma.patient.findUnique({
        where: { id: patientUser1.id }
      });
      expect(dbPatient).not.toBeNull();

      // Verify doctor still exists
      const dbDoctor = await prisma.doctor.findUnique({
        where: { id: doctor1.id }
      });
      expect(dbDoctor).not.toBeNull();
    });
  });
});
