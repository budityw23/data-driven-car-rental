import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT', details?: Record<string, unknown>) {
    super(message, 409, code, true, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
