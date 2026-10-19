import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Register a new doctor record
 * @param {string} userId - Authenticated user UUID (creator)
 * @param {object} doctorData - Validated doctor input
 */
export const createDoctor = async (userId, doctorData) => {
  const { name, email, phone, specialization } = doctorData;
  const normalizedEmail = email.trim().toLowerCase();

  // Enforce unique doctor email
  const existingDoctor = await prisma.doctor.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingDoctor) {
    throw new AppError('Doctor with this email already exists', 409);
  }

  const doctor = await prisma.doctor.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      specialization: specialization.trim(),
      createdById: userId
    }
  });

  return doctor;
};

/**
 * Retrieve all registered doctors
 */
export const getAllDoctors = async () => {
  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      specialization: true,
      createdById: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return doctors;
};

/**
 * Retrieve single doctor by ID
 * @param {string} doctorId - Doctor UUID
 */
export const getDoctorById = async (doctorId) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
};

/**
 * Update doctor details with authorization check
 * @param {string} userId - Authenticated user UUID
 * @param {string} doctorId - Doctor UUID
 * @param {object} updateData - Validated partial update data
 */
export const updateDoctor = async (userId, doctorId, updateData) => {
  const doctor = await getDoctorById(doctorId);

  // Authorization check: Only creator may update if creator is assigned
  if (doctor.createdById && doctor.createdById !== userId) {
    throw new AppError('You do not have permission to modify this doctor', 403);
  }

  const dataToUpdate = {};
  if (updateData.name !== undefined) dataToUpdate.name = updateData.name.trim();
  if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone.trim();
  if (updateData.specialization !== undefined) dataToUpdate.specialization = updateData.specialization.trim();

  if (updateData.email !== undefined) {
    const normalizedEmail = updateData.email.trim().toLowerCase();
    if (normalizedEmail !== doctor.email) {
      const emailConflict = await prisma.doctor.findUnique({
        where: { email: normalizedEmail }
      });
      if (emailConflict) {
        throw new AppError('Doctor with this email already exists', 409);
      }
      dataToUpdate.email = normalizedEmail;
    }
  }

  const updatedDoctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: dataToUpdate
  });

  return updatedDoctor;
};

/**
 * Delete a doctor with referential integrity enforcement
 * @param {string} userId - Authenticated user UUID
 * @param {string} doctorId - Doctor UUID
 */
export const deleteDoctor = async (userId, doctorId) => {
  const doctor = await getDoctorById(doctorId);

  // Authorization check: Only creator may delete if creator is assigned
  if (doctor.createdById && doctor.createdById !== userId) {
    throw new AppError('You do not have permission to delete this doctor', 403);
  }

  // Check for active patient-doctor mappings
  const mappingCount = await prisma.patientDoctorMapping.count({
    where: { doctorId }
  });

  if (mappingCount > 0) {
    throw new AppError(
      'Cannot delete doctor with active patient assignments. Remove all patient-doctor mappings first.',
      409
    );
  }

  await prisma.doctor.delete({
    where: { id: doctorId }
  });

  return { id: doctorId };
};

export default {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
