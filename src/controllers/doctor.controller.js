import * as doctorService from '../services/doctor.service.js';

/**
 * Handle new doctor creation
 * POST /api/doctors/
 */
export const create = async (req, res, next) => {
  try {
    const doctor = await doctorService.createDoctor(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all registered doctors
 * GET /api/doctors/
 */
export const getAll = async (req, res, next) => {
  try {
    const doctors = await doctorService.getAllDoctors();
    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single doctor by ID
 * GET /api/doctors/:id/
 */
export const getById = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Doctor retrieved successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor by ID
 * PUT /api/doctors/:id/
 */
export const update = async (req, res, next) => {
  try {
    const updatedDoctor = await doctorService.updateDoctor(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete doctor by ID
 * DELETE /api/doctors/:id/
 */
export const remove = async (req, res, next) => {
  try {
    await doctorService.deleteDoctor(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
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
