import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import prisma from '../config/db';

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // Check cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // Fallback to Auth Header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    try {
      const decoded = verifyToken(token);
      
      // Verify user still exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true },
      });

      if (!user) {
        throw new AppError('Not authorized, user not found', 401);
      }

      req.user = { id: user.id };
      next();
    } catch (err) {
      throw new AppError('Not authorized, invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};
