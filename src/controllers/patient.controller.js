import * as patientService from '../services/patient.service.js';

/**
 * Handle new patient creation
 * POST /api/patients/
 */
export const create = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all patients owned by current user
 * GET /api/patients/
 */
export const getAll = async (req, res, next) => {
  try {
    const patients = await patientService.getPatients(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Patients retrieved successfully',
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single patient by ID
 * GET /api/patients/:id/
 */
export const getById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient retrieved successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient by ID
 * PUT /api/patients/:id/
 */
export const update = async (req, res, next) => {
  try {
    const updatedPatient = await patientService.updatePatient(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete patient by ID
 * DELETE /api/patients/:id/
 */
export const remove = async (req, res, next) => {
  try {
    await patientService.deletePatient(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  remove
};
