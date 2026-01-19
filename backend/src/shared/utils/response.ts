import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponse['meta']): Response {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details?: Record<string, unknown>): Response {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
