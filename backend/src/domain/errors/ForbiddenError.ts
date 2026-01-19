import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
