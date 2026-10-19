import { Router } from 'express';
import mappingController from '../controllers/mapping.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createMappingSchema,
  mappingPatientIdParamSchema,
  mappingIdParamSchema
} from '../validators/mapping.validator.js';

const router = Router();

// Protect all mapping endpoints with JWT authentication
router.use(authenticate);

// Collection routes
router.route('/')
  .post(validate(createMappingSchema), mappingController.create)
  .get(mappingController.getAll);

// Route to get all doctors assigned to a specific patient
router.get('/:patient_id', validate(mappingPatientIdParamSchema, 'params'), mappingController.getByPatientId);

// Route to delete a specific mapping by ID
router.delete('/:id', validate(mappingIdParamSchema, 'params'), mappingController.remove);

export default router;
