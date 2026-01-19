import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/index.js';
import logger from '../../infrastructure/logger/index.js';
import { sendError } from '../../shared/utils/response.js';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response {
  logger.error('Error occurred', { error: err.message, stack: err.stack, path: req.path, method: req.method });

  if (err instanceof ZodError) {
    const details = {
      fields: err.errors.reduce((acc, e) => {
        const field = e.path.join('.');
        acc[field] = acc[field] || [];
        acc[field].push(e.message);
        return acc;
      }, {} as Record<string, string[]>),
    };
    return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
  }

  const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
}
