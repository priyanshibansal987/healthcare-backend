import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 10;

/**
 * Generate signed JWT token
 * @param {{ id: string, email: string }} payload 
 * @returns {string}
 */
export const generateToken = (payload) => {
  return jwt.sign(
    { id: payload.id, email: payload.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user
 * @param {{ name: string, email: string, password: string }} data 
 * @returns {Promise<{ user: { id: string, name: string, email: string, createdAt: Date } }>}
 */
export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing user with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Save user in database
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  return { user };
};

/**
 * Authenticate user and issue JWT
 * @param {{ email: string, password: string }} credentials 
 * @returns {Promise<{ token: string, user: { id: string, name: string, email: string } }>}
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  // Generic 401 error to avoid user enumeration
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Issue token
  const token = generateToken({ id: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
};

export default {
  registerUser,
  loginUser,
  generateToken
};
