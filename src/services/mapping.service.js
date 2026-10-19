import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Assign a doctor to a patient owned by the authenticated user
 * @param {string} userId - Authenticated user UUID
 * @param {{ patientId: string, doctorId: string }} data 
 */
export const createMapping = async (userId, { patientId, doctorId }) => {
  // 1. Verify patient existence and ownership
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient || patient.userId !== userId) {
    throw new AppError('Patient not found', 404);
  }

  // 2. Verify doctor existence
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // 3. Check for existing mapping (duplicate prevention)
  const existingMapping = await prisma.patientDoctorMapping.findUnique({
    where: {
      patient_doctor_unique: {
        patientId,
        doctorId
      }
    }
  });

  if (existingMapping) {
    throw new AppError('Doctor is already assigned to this patient', 409);
  }

  // 4. Create mapping record
  const mapping = await prisma.patientDoctorMapping.create({
    data: {
      patientId,
      doctorId
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          gender: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          specialization: true
        }
      }
    }
  });

  return mapping;
};

/**
 * Retrieve all mappings for patients owned by the authenticated user
 * @param {string} userId - Authenticated user UUID
 */
export const getUserMappings = async (userId) => {
  const mappings = await prisma.patientDoctorMapping.findMany({
    where: {
      patient: {
        userId
      }
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          gender: true
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
          phone: true
        }
      }
    },
    orderBy: { assignedAt: 'desc' }
  });

  return mappings;
};

/**
 * Retrieve all doctors assigned to a specific patient owned by current user
 * @param {string} userId - Authenticated user UUID
 * @param {string} patientId - Target patient UUID
 */
export const getDoctorsForPatient = async (userId, patientId) => {
  // Verify patient ownership first
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient || patient.userId !== userId) {
    throw new AppError('Patient not found', 404);
  }

  const mappings = await prisma.patientDoctorMapping.findMany({
    where: { patientId },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          specialization: true
        }
      }
    },
    orderBy: { assignedAt: 'desc' }
  });

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender
    },
    assignedDoctors: mappings.map((m) => ({
      mappingId: m.id,
      assignedAt: m.assignedAt,
      ...m.doctor
    }))
  };
};

/**
 * Remove a patient-doctor mapping without deleting either patient or doctor
 * @param {string} userId - Authenticated user UUID
 * @param {string} mappingId - Mapping UUID to remove
 */
export const deleteMapping = async (userId, mappingId) => {
  const mapping = await prisma.patientDoctorMapping.findUnique({
    where: { id: mappingId },
    include: {
      patient: true
    }
  });

  // Verify existence and patient ownership
  if (!mapping || mapping.patient.userId !== userId) {
    throw new AppError('Mapping not found', 404);
  }

  // Delete the mapping relationship only
  await prisma.patientDoctorMapping.delete({
    where: { id: mappingId }
  });

  return { id: mappingId };
};

export default {
  createMapping,
  getUserMappings,
  getDoctorsForPatient,
  deleteMapping
};
