import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../../domain/errors/index.js';

describe('Domain Errors', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with field details', () => {
      const details = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ];
      const error = new ValidationError('Validation failed', details);

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });

    it('should work without details', () => {
      const error = new ValidationError('Validation failed');
      expect(error.details).toBeUndefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError', () => {
      const error = new NotFoundError('User', '123');
      expect(error.message).toBe('User with id 123 not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError', () => {
      const error = new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
      expect(error.message).toBe('Invalid token');
      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.statusCode).toBe(401);
    });

    it('should use default code', () => {
      const error = new UnauthorizedError('Not authorized');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError', () => {
      const error = new ForbiddenError('Access denied', 'ACCESS_DENIED');
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('ACCESS_DENIED');
      expect(error.statusCode).toBe(403);
    });

    it('should use default code', () => {
      const error = new ForbiddenError('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError', () => {
      const error = new ConflictError('Resource already exists', 'DUPLICATE');
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('DUPLICATE');
      expect(error.statusCode).toBe(409);
    });

    it('should use default code', () => {
      const error = new ConflictError('Conflict');
      expect(error.code).toBe('CONFLICT');
    });
  });
});
