import prisma from '../config/prisma.js';
import { AppError } from './error.middleware.js';

/**
 * Authorize patient ownership middleware
 * Confirms that the patient specified in req.params.id exists and is owned by req.user.id
 */
export const authorizePatientOwnership = async (req, res, next) => {
  try {
    const patientId = req.params.id || req.params.patient_id;
    if (!patientId) {
      return next();
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.userId !== req.user.id) {
      throw new AppError('Patient not found', 404);
    }

    req.patient = patient;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authorizePatientOwnership
};
