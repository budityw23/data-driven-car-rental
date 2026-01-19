import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const adminBookingFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  carId: z.string().uuid().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  startDateFrom: z.string().datetime().transform((val) => new Date(val)).optional(),
  startDateTo: z.string().datetime().transform((val) => new Date(val)).optional(),
  page: z.string().optional().default('1').transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default('20').transform((val) => parseInt(val, 10)),
  sortBy: z.enum(['createdAt', 'startDate', 'totalPrice']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().max(500).optional(),
});

export type AdminBookingFiltersDto = z.infer<typeof adminBookingFiltersSchema>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;
