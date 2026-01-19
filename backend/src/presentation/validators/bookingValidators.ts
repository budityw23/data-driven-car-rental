import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBookingSchema = z.object({
  carId: z.string().uuid('Invalid car ID'),
  pickupLocationId: z.string().uuid('Invalid pickup location ID'),
  dropoffLocationId: z.string().uuid('Invalid dropoff location ID'),
  startDate: z.string().datetime('Invalid start date format').transform((val) => new Date(val)),
  endDate: z.string().datetime('Invalid end date format').transform((val) => new Date(val)),
  addonIds: z.array(z.string().uuid()).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancel reason is required').max(500, 'Reason too long'),
});

export const getBookingsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  startDateFrom: z.string().datetime().transform((val) => new Date(val)).optional(),
  startDateTo: z.string().datetime().transform((val) => new Date(val)).optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'totalPrice']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const bookingIdSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});
