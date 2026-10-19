import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string({
    required_error: 'Doctor name is required'
  }).trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must not exceed 100 characters'),

  email: z.string({
    required_error: 'Doctor email is required'
  }).trim().toLowerCase().email('Invalid email address format'),

  phone: z.string({
    required_error: 'Doctor phone number is required'
  }).trim().min(5, 'Phone number must be at least 5 digits').max(25, 'Phone number must not exceed 25 characters'),

  specialization: z.string({
    required_error: 'Doctor specialization is required'
  }).trim().min(2, 'Specialization must be at least 2 characters long').max(100, 'Specialization must not exceed 100 characters')
});

export const updateDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must not exceed 100 characters').optional(),

  email: z.string().trim().toLowerCase().email('Invalid email address format').optional(),

  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(25, 'Phone number must not exceed 25 characters').optional(),

  specialization: z.string().trim().min(2, 'Specialization must be at least 2 characters long').max(100, 'Specialization must not exceed 100 characters').optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const doctorIdParamSchema = z.object({
  id: z.string().uuid('Invalid doctor ID format. Must be a valid UUID')
});
