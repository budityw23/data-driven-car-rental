import { Router } from 'express';
import { CarController } from '../controllers/CarController.js';
import { asyncHandler, authenticate, requireAdmin, validateBody, validateParams } from '../middlewares/index.js';
import { createCarSchema, updateCarSchema, carIdSchema } from '../validators/carValidators.js';

const router = Router();

/**
 * @swagger
 * /api/cars:
 *   get:
 *     tags: [Cars]
 *     summary: Get all cars with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [SUV, SEDAN, HATCHBACK, MPV, VAN] }
 *       - in: query
 *         name: seats
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of cars with pagination
 */
router.get('/', asyncHandler(CarController.getCars));

/**
 * @swagger
 * /api/cars/{id}/availability:
 *   get:
 *     tags: [Cars]
 *     summary: Check car availability for specific dates
 *     description: Check if a car is available for booking within a date range and get conflicting bookings if unavailable
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Car ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date in ISO 8601 format
 *         example: "2026-01-22T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date in ISO 8601 format
 *         example: "2026-01-25T00:00:00.000Z"
 *     responses:
 *       200:
 *         description: Availability status with conflicting bookings if unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       description: Whether the car is available
 *                     carId:
 *                       type: string
 *                       format: uuid
 *                     requestedStartDate:
 *                       type: string
 *                       format: date-time
 *                     requestedEndDate:
 *                       type: string
 *                       format: date-time
 *                     conflictingBookings:
 *                       type: array
 *                       description: List of bookings that conflict with requested dates
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *       400:
 *         description: Validation error (invalid dates)
 *       404:
 *         description: Car not found
 */
router.get(
  '/:id/availability',
  validateParams(carIdSchema),
  asyncHandler(CarController.checkAvailability)
);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     tags: [Cars]
 *     summary: Get car by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get(
  '/:id',
  validateParams(carIdSchema),
  asyncHandler(CarController.getCarById)
);

/**
 * @swagger
 * /api/cars:
 *   post:
 *     tags: [Cars]
 *     summary: Create a new car (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(createCarSchema),
  asyncHandler(CarController.createCar)
);

/**
 * @swagger
 * /api/cars/{id}:
 *   patch:
 *     tags: [Cars]
 *     summary: Update a car (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       200:
 *         description: Car updated
 *       404:
 *         description: Car not found
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(carIdSchema),
  validateBody(updateCarSchema),
  asyncHandler(CarController.updateCar)
);

export default router;
