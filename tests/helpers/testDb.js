import env from '../../src/config/env.js';
import prisma from '../../src/config/prisma.js';

/**
 * Clean up database records between tests
 */
export const cleanDatabase = async () => {
  // Delete in order respecting foreign keys
  await prisma.patientDoctorMapping.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

export default {
  cleanDatabase,
  disconnectDatabase
};
