import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../infrastructure/auth/index.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/index.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { UserRole } from '../../domain/entities/index.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';

const userRepository = new UserRepository();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    // Verify user still exists
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found', 'UNAUTHORIZED');
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return next(new UnauthorizedError('Authentication required', 'UNAUTHORIZED'));
    }

    if (!roles.includes(authenticatedReq.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(UserRole.ADMIN)(req, res, next);
}
