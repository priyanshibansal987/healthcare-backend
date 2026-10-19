import prisma from '../src/config/prisma.js';
import env from '../src/config/env.js';

const BASE_URL = 'http://localhost:5000/api';

async function runAudit() {
  console.log('--- STARTING REAL DATABASE-BACKED VERIFICATION ---');
  const results = [];

  const logStep = (step, name, passed, details) => {
    results.push({ step, name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Step ${step}: ${name} - ${details}`);
  };

  try {
    // 1. Register test user via API
    const regPayload = {
      name: 'Audit Doctor Lead',
      email: 'audit.doctor@hospital.org',
      password: 'AuditPassword123!'
    };

    // Clean up if already exists
    await prisma.user.deleteMany({ where: { email: regPayload.email } });

    const regRes = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    const regData = await regRes.json();
    logStep(1, 'API User Registration', regRes.status === 201 && regData.success === true, `HTTP ${regRes.status}`);

    // 2. Confirm user in PostgreSQL & 3. Password Hashing
    const dbUser = await prisma.user.findUnique({
      where: { email: regPayload.email }
    });
    const isHashed = dbUser && dbUser.passwordHash.startsWith('$2') && dbUser.passwordHash !== regPayload.password;
    logStep(2, 'PostgreSQL User Record Persistence', !!dbUser, `User ID: ${dbUser?.id}`);
    logStep(3, 'Bcrypt Password Hashing in DB', isHashed, `Hash Prefix: ${dbUser?.passwordHash.substring(0, 7)}`);

    // 4. Log in and verify JWT
    const loginRes = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regPayload.email,
        password: regPayload.password
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    const tokenValid = !!token && token.split('.').length === 3;
    logStep(4, 'JWT Issuance & Structure', loginRes.status === 200 && tokenValid, `Token format valid: ${tokenValid}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 5. Create a patient and verify owner relationship
    const patientPayload = {
      name: 'Audit Patient Alpha',
      dateOfBirth: '1988-11-20',
      gender: 'Male',
      email: 'alpha@auditpatient.org',
      phone: '9811223344',
      address: 'Suite 404, Medical Plaza'
    };
    const patientRes = await fetch(`${BASE_URL}/patients/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(patientPayload)
    });
    const patientData = await patientRes.json();
    const patientId = patientData.data?.id;

    const dbPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    const isOwnerMatch = dbPatient && dbPatient.userId === dbUser.id;
    logStep(5, 'Patient Creation & Ownership Relationship', patientRes.status === 201 && isOwnerMatch, `Patient ID: ${patientId}, Owner: ${dbPatient?.userId}`);

    // 6. Create a doctor and verify stored record
    const doctorPayload = {
      name: 'Dr. Evelyn Marcus',
      email: 'evelyn.marcus@auditclinic.org',
      phone: '9922334455',
      specialization: 'Neurological Sciences'
    };
    // Clean up if doctor email exists
    await prisma.doctor.deleteMany({ where: { email: doctorPayload.email } });

    const doctorRes = await fetch(`${BASE_URL}/doctors/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(doctorPayload)
    });
    const doctorData = await doctorRes.json();
    const doctorId = doctorData.data?.id;

    const dbDoctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    logStep(6, 'Doctor Creation & DB Persistence', doctorRes.status === 201 && !!dbDoctor, `Doctor ID: ${doctorId}, Specialization: ${dbDoctor?.specialization}`);

    // 7. Assign doctor to patient and verify mapping
    const mapPayload = { patientId, doctorId };
    const mapRes = await fetch(`${BASE_URL}/mappings/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(mapPayload)
    });
    const mapData = await mapRes.json();
    const mappingId = mapData.data?.id;

    const dbMapping = await prisma.patientDoctorMapping.findUnique({
      where: { id: mappingId }
    });
    const mappingPersisted = dbMapping && dbMapping.patientId === patientId && dbMapping.doctorId === doctorId;
    logStep(7, 'Patient-Doctor Assignment & Foreign Keys', mapRes.status === 201 && mappingPersisted, `Mapping ID: ${mappingId}`);

    // 8. Retrieve records through API
    const getPatientRes = await fetch(`${BASE_URL}/patients/${patientId}/`, { headers: authHeaders });
    const getDoctorRes = await fetch(`${BASE_URL}/doctors/${doctorId}/`, { headers: authHeaders });
    const getAssignedRes = await fetch(`${BASE_URL}/mappings/${patientId}/`, { headers: authHeaders });
    const getAssignedData = await getAssignedRes.json();

    const retrievalSuccess = getPatientRes.status === 200 &&
      getDoctorRes.status === 200 &&
      getAssignedRes.status === 200 &&
      getAssignedData.data?.assignedDoctors?.length === 1;
    logStep(8, 'API Record Retrieval & Relation Traversal', retrievalSuccess, `Assigned doctors count: ${getAssignedData.data?.assignedDoctors?.length}`);

    // 9. Update record and confirm updated value persists in DB
    const updateRes = await fetch(`${BASE_URL}/patients/${patientId}/`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ phone: '9999999999', address: 'Updated Clinical Suite 500' })
    });
    const dbPatientUpdated = await prisma.patient.findUnique({ where: { id: patientId } });
    const updatePersisted = updateRes.status === 200 && dbPatientUpdated.phone === '9999999999';
    logStep(9, 'Record Update & PostgreSQL Persistence', updatePersisted, `Updated phone in DB: ${dbPatientUpdated?.phone}`);

    // 10. Attempt doctor deletion with active mapping (Policy Check: 409 Conflict)
    const delDocFailRes = await fetch(`${BASE_URL}/doctors/${doctorId}/`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const docStillExists = await prisma.doctor.findUnique({ where: { id: doctorId } });
    logStep(10, 'Doctor Deletion Blocked by Active Mapping', delDocFailRes.status === 409 && !!docStillExists, `Status: ${delDocFailRes.status} Conflict`);

    // 11. Delete mapping and verify patient and doctor remain
    const delMapRes = await fetch(`${BASE_URL}/mappings/${mappingId}/`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const mapGone = await prisma.patientDoctorMapping.findUnique({ where: { id: mappingId } });
    const patientStillThere = await prisma.patient.findUnique({ where: { id: patientId } });
    const doctorStillThere = await prisma.doctor.findUnique({ where: { id: doctorId } });
    const mapDeletedSafely = delMapRes.status === 200 && !mapGone && !!patientStillThere && !!doctorStillThere;
    logStep(11, 'Mapping Removal Leaves Patient and Doctor Intact', mapDeletedSafely, `Mapping in DB: ${!mapGone}, Patient remains: ${!!patientStillThere}, Doctor remains: ${!!doctorStillThere}`);

    // Clean up test records
    await prisma.patient.delete({ where: { id: patientId } });
    await prisma.doctor.delete({ where: { id: doctorId } });
    await prisma.user.delete({ where: { id: dbUser.id } });
    console.log('✅ Audit test records cleanly removed from database.');

    console.log('--- DATABASE-BACKED VERIFICATION SUMMARY ---');
    const allPassed = results.every(r => r.passed);
    console.log(`RESULT: ${allPassed ? 'ALL STEPS PASSED (11/11)' : 'SOME STEPS FAILED'}`);

  } catch (error) {
    console.error('❌ Error during database audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
