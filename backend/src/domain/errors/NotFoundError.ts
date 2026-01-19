import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, details?: Record<string, unknown>) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, true, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
