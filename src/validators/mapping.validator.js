import { z } from 'zod';

export const createMappingSchema = z.object({
  patientId: z.string({
    required_error: 'Patient ID is required'
  }).uuid('Invalid patient ID format. Must be a valid UUID'),

  doctorId: z.string({
    required_error: 'Doctor ID is required'
  }).uuid('Invalid doctor ID format. Must be a valid UUID')
});

export const mappingPatientIdParamSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID format. Must be a valid UUID')
});

export const mappingIdParamSchema = z.object({
  id: z.string().uuid('Invalid mapping ID format. Must be a valid UUID')
});
