import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string({
    required_error: 'Patient name is required'
  }).trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must not exceed 100 characters'),

  dateOfBirth: z.string({
    required_error: 'Date of birth is required'
  }).refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth format. Use YYYY-MM-DD or ISO date string'
  }),

  gender: z.string({
    required_error: 'Gender is required'
  }).trim().min(1, 'Gender is required').max(30, 'Gender must not exceed 30 characters'),

  email: z.string().trim().toLowerCase().email('Invalid email address format').optional().or(z.literal('')),

  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(25, 'Phone number must not exceed 25 characters').optional().or(z.literal('')),

  address: z.string().trim().max(255, 'Address must not exceed 255 characters').optional().or(z.literal(''))
});

export const updatePatientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name must not exceed 100 characters').optional(),

  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date of birth format. Use YYYY-MM-DD or ISO date string'
  }).optional(),

  gender: z.string().trim().min(1, 'Gender is required').max(30, 'Gender must not exceed 30 characters').optional(),

  email: z.string().trim().toLowerCase().email('Invalid email address format').optional().or(z.literal('')),

  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(25, 'Phone number must not exceed 25 characters').optional().or(z.literal('')),

  address: z.string().trim().max(255, 'Address must not exceed 255 characters').optional().or(z.literal(''))
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const patientIdParamSchema = z.object({
  id: z.string().uuid('Invalid patient ID format. Must be a valid UUID')
});
