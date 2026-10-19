import * as mappingService from '../services/mapping.service.js';

/**
 * Handle new patient-doctor assignment
 * POST /api/mappings/
 */
export const create = async (req, res, next) => {
  try {
    const mapping = await mappingService.createMapping(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Doctor assigned to patient successfully',
      data: mapping
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all mappings for patients owned by the current user
 * GET /api/mappings/
 */
export const getAll = async (req, res, next) => {
  try {
    const mappings = await mappingService.getUserMappings(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Mappings retrieved successfully',
      data: mappings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all doctors assigned to a specific patient
 * GET /api/mappings/:patient_id/
 */
export const getByPatientId = async (req, res, next) => {
  try {
    const result = await mappingService.getDoctorsForPatient(req.user.id, req.params.patient_id);
    res.status(200).json({
      success: true,
      message: 'Assigned doctors retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific patient-doctor mapping
 * DELETE /api/mappings/:id/
 */
export const remove = async (req, res, next) => {
  try {
    await mappingService.deleteMapping(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient-doctor mapping removed successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getByPatientId,
  remove
};
