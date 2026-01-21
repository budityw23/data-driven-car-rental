import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { asyncHandler, validateParams, validateBody, authenticate, requireAdmin } from '../middlewares/index.js';
import { updateBookingStatusSchema } from '../validators/adminValidators.js';
import { bookingIdSchema } from '../validators/bookingValidators.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard analytics
 *     description: Retrieve comprehensive analytics including revenue, bookings, fleet stats, and top cars
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/dashboard',
  asyncHandler(AdminController.getDashboardStats)
);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: Get all bookings with filters
 *     description: Retrieve all bookings in the system with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: carId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PICKED_UP, RETURNED, CANCELLED]
 *       - in: query
 *         name: startDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, startDate, totalPrice]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of all bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/bookings',
  asyncHandler(AdminController.getAllBookings)
);

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update booking status
 *     description: Change the status of a booking (e.g., confirm, mark as picked up, etc.)
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PICKED_UP, RETURNED, CANCELLED]
 *               reason:
 *                 type: string
 *                 description: Optional reason for status change
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Booking not found
 */
router.patch(
  '/bookings/:id/status',
  validateParams(bookingIdSchema),
  validateBody(updateBookingStatusSchema),
  asyncHandler(AdminController.updateBookingStatus)
);

export default router;
