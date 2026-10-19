import { Router } from 'express';
import doctorController from '../controllers/doctor.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  doctorIdParamSchema
} from '../validators/doctor.validator.js';

const router = Router();

// Protect all doctor routes with JWT authentication
router.use(authenticate);

// Collection routes
router.route('/')
  .post(validate(createDoctorSchema), doctorController.create)
  .get(doctorController.getAll);

// Individual doctor item routes
router.route('/:id')
  .get(validate(doctorIdParamSchema, 'params'), doctorController.getById)
  .put(
    validate(doctorIdParamSchema, 'params'),
    validate(updateDoctorSchema),
    doctorController.update
  )
  .delete(validate(doctorIdParamSchema, 'params'), doctorController.remove);

export default router;
