import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Create a new patient record associated with the authenticated user
 * @param {string} userId - Authenticated user UUID
 * @param {object} patientData - Validated patient input
 */
export const createPatient = async (userId, patientData) => {
  const { name, dateOfBirth, gender, email, phone, address } = patientData;

  const patient = await prisma.patient.create({
    data: {
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      userId // Secured from JWT, preventing mass-assignment
    }
  });

  return patient;
};

/**
 * Retrieve all patient records belonging to the authenticated user
 * @param {string} userId - Authenticated user UUID
 */
export const getPatients = async (userId) => {
  const patients = await prisma.patient.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return patients;
};

/**
 * Retrieve a specific patient record with ownership enforcement
 * @param {string} userId - Authenticated user UUID
 * @param {string} patientId - Target patient UUID
 */
export const getPatientById = async (userId, patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  // Check existence and ownership (returning 404 avoids leaking existence across users)
  if (!patient || patient.userId !== userId) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
};

/**
 * Update an existing patient record belonging to the authenticated user
 * @param {string} userId - Authenticated user UUID
 * @param {string} patientId - Target patient UUID
 * @param {object} updateData - Validated partial update data
 */
export const updatePatient = async (userId, patientId, updateData) => {
  // First verify existence and ownership
  await getPatientById(userId, patientId);

  const dataToUpdate = {};
  if (updateData.name !== undefined) dataToUpdate.name = updateData.name.trim();
  if (updateData.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = new Date(updateData.dateOfBirth);
  if (updateData.gender !== undefined) dataToUpdate.gender = updateData.gender.trim();
  if (updateData.email !== undefined) dataToUpdate.email = updateData.email ? updateData.email.trim().toLowerCase() : null;
  if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone ? updateData.phone.trim() : null;
  if (updateData.address !== undefined) dataToUpdate.address = updateData.address ? updateData.address.trim() : null;

  const updatedPatient = await prisma.patient.update({
    where: { id: patientId },
    data: dataToUpdate
  });

  return updatedPatient;
};

/**
 * Delete a patient record belonging to the authenticated user
 * @param {string} userId - Authenticated user UUID
 * @param {string} patientId - Target patient UUID
 */
export const deletePatient = async (userId, patientId) => {
  // Verify existence and ownership
  await getPatientById(userId, patientId);

  await prisma.patient.delete({
    where: { id: patientId }
  });

  return { id: patientId };
};

export default {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
