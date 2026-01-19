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
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard analytics
 * @access  Admin only
 */
router.get(
  '/dashboard',
  asyncHandler(AdminController.getDashboardStats)
);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings with filters
 * @access  Admin only
 */
router.get(
  '/bookings',
  asyncHandler(AdminController.getAllBookings)
);

/**
 * @route   PATCH /api/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin only
 */
router.patch(
  '/bookings/:id/status',
  validateParams(bookingIdSchema),
  validateBody(updateBookingStatusSchema),
  asyncHandler(AdminController.updateBookingStatus)
);

export default router;
