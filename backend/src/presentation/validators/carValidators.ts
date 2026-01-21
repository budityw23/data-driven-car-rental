import { z } from 'zod';
import { CarType, Transmission, FuelType, CarStatus } from '@prisma/client';

export const createCarSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(100, 'Brand too long').trim(),
  model: z.string().min(1, 'Model is required').max(100, 'Model too long').trim(),
  year: z.number().int().min(2000, 'Year must be 2000 or later').max(new Date().getFullYear() + 1),
  type: z.nativeEnum(CarType, { errorMap: () => ({ message: 'Invalid car type' }) }),
  seats: z.number().int().min(2, 'Minimum 2 seats').max(20, 'Maximum 20 seats'),
  transmission: z.nativeEnum(Transmission, { errorMap: () => ({ message: 'Invalid transmission type' }) }),
  fuel: z.nativeEnum(FuelType, { errorMap: () => ({ message: 'Invalid fuel type' }) }),
  dailyPrice: z.number().positive('Daily price must be positive').max(100000000, 'Price too high'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export const updateCarSchema = z.object({
  brand: z.string().min(1).max(100).trim().optional(),
  model: z.string().min(1).max(100).trim().optional(),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
  type: z.nativeEnum(CarType).optional(),
  seats: z.number().int().min(2).max(20).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  dailyPrice: z.number().positive().max(100000000).optional(),
  images: z.array(z.string().url()).optional(),
  status: z.nativeEnum(CarStatus).optional(),
});

export const getCarQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.nativeEnum(CarType).optional(),
  seats: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  priceMin: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  priceMax: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional(),
  startDate: z.string().datetime().transform((val) => new Date(val)).optional(),
  endDate: z.string().datetime().transform((val) => new Date(val)).optional(),
  sortBy: z.enum(['dailyPrice', 'createdAt', 'seats', 'year']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const carIdSchema = z.object({
  id: z.string().uuid('Invalid car ID format'),
});

export const checkAvailabilityQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date format').transform((val) => new Date(val)),
  endDate: z.string().datetime('Invalid end date format').transform((val) => new Date(val)),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
