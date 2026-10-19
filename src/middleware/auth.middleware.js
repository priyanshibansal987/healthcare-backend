import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { AppError } from './error.middleware.js';

/**
 * Authentication Middleware
 * Validates JWT Bearer token and attaches user to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      throw new AppError('Authentication token required', 401);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Authentication token has expired', 401);
      }
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
