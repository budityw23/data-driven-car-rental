import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../../shared/utils/response.js';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = await schema.body.parseAsync(req.body);
      if (schema.query) {
        const validatedQuery = await schema.query.parseAsync(req.query);
        (req as any).query = validatedQuery;
      }
      if (schema.params) req.params = await schema.params.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = {
          fields: (error.errors || []).reduce((acc, e) => {
            const field = e.path.join('.');
            acc[field] = acc[field] || [];
            acc[field].push(e.message);
            return acc;
          }, {} as Record<string, string[]>),
        };
        return sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
      }
      next(error);
    }
  };
}

export const validateBody = (schema: AnyZodObject) => validateRequest({ body: schema });
export const validateQuery = (schema: AnyZodObject) => validateRequest({ query: schema });
export const validateParams = (schema: AnyZodObject) => validateRequest({ params: schema });
