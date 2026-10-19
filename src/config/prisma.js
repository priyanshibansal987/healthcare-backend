import { PrismaClient } from '@prisma/client';
import env from './env.js';

// Determine logging options based on current environment
const logLevels = env.NODE_ENV === 'development'
  ? ['warn', 'error']
  : ['error'];

/**
 * Shared singleton PrismaClient instance
 */
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  },
  log: logLevels
});

export default prisma;
