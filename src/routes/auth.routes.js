import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import validate from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

// Registration routes (supporting both with and without trailing slash)
router.post('/register', validate(registerSchema), authController.register);
router.post('/register/', validate(registerSchema), authController.register);

// Login routes (supporting both with and without trailing slash)
router.post('/login', validate(loginSchema), authController.login);
router.post('/login/', validate(loginSchema), authController.login);

export default router;
