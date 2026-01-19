import { AppError } from './AppError.js';

export interface ValidationFieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly fields?: ValidationFieldError[];

  constructor(message: string = 'Validation failed', fields?: ValidationFieldError[], details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, {
      ...details,
      fields: fields?.reduce((acc, f) => {
        acc[f.field] = acc[f.field] || [];
        acc[f.field].push(f.message);
        return acc;
      }, {} as Record<string, string[]>),
    });
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
