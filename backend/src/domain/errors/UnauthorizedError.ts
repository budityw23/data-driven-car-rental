import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'UNAUTHORIZED', details?: Record<string, unknown>) {
    super(message, 401, code, true, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
