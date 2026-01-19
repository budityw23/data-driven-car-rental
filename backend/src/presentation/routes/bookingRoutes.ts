import { Router } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { asyncHandler, authenticate, validateBody, validateParams, bookingLimiter } from '../middlewares/index.js';
import { createBookingSchema, cancelBookingSchema, bookingIdSchema } from '../validators/bookingValidators.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * POST /api/bookings
 * Create a new booking
 * Private - requires authentication
 */
router.post(
  '/',
  bookingLimiter,
  validateBody(createBookingSchema),
  asyncHandler(BookingController.createBooking)
);

/**
 * GET /api/bookings
 * Get user's bookings
 * Private - requires authentication
 */
router.get('/', asyncHandler(BookingController.getBookings));

/**
 * GET /api/bookings/:id
 * Get booking by ID
 * Private - requires authentication (own bookings only, or admin)
 */
router.get(
  '/:id',
  validateParams(bookingIdSchema),
  asyncHandler(BookingController.getBookingById)
);

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 * Private - requires authentication (own bookings only, or admin)
 */
router.post(
  '/:id/cancel',
  validateParams(bookingIdSchema),
  validateBody(cancelBookingSchema),
  asyncHandler(BookingController.cancelBooking)
);

export default router;
