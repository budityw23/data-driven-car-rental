import { Router } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { asyncHandler, authenticate, validateBody, validateParams, bookingLimiter } from '../middlewares/index.js';
import { createBookingSchema, cancelBookingSchema, bookingIdSchema } from '../validators/bookingValidators.js';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [carId, startDate, endDate, pickupLocationId, returnLocationId]
 *             properties:
 *               carId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               pickupLocationId:
 *                 type: string
 *                 format: uuid
 *               returnLocationId:
 *                 type: string
 *                 format: uuid
 *               addonIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  bookingLimiter,
  validateBody(createBookingSchema),
  asyncHandler(BookingController.createBooking)
);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get user's bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PICKED_UP, RETURNED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of user bookings
 *       401:
 *         description: Unauthorized
 */
router.get('/', asyncHandler(BookingController.getBookings));

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get(
  '/:id',
  validateParams(bookingIdSchema),
  asyncHandler(BookingController.getBookingById)
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.post(
  '/:id/cancel',
  validateParams(bookingIdSchema),
  validateBody(cancelBookingSchema),
  asyncHandler(BookingController.cancelBooking)
);

export default router;
