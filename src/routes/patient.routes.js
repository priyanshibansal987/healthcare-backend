import { Router } from 'express';
import patientController from '../controllers/patient.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdParamSchema
} from '../validators/patient.validator.js';

const router = Router();

// Protect all patient endpoints with JWT authentication
router.use(authenticate);

// Collection routes
router.route('/')
  .post(validate(createPatientSchema), patientController.create)
  .get(patientController.getAll);

// Individual patient item routes
router.route('/:id')
  .get(validate(patientIdParamSchema, 'params'), patientController.getById)
  .put(
    validate(patientIdParamSchema, 'params'),
    validate(updatePatientSchema),
    patientController.update
  )
  .delete(validate(patientIdParamSchema, 'params'), patientController.remove);

export default router;
