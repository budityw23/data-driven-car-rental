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
