import { Router } from 'express';
import { LocationController } from '../controllers/LocationController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * @swagger
 * /api/locations:
 *   get:
 *     tags: [Locations]
 *     summary: Get all active locations
 *     description: Retrieve all available pickup/return locations
 *     responses:
 *       200:
 *         description: List of active locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 */
router.get('/', asyncHandler(LocationController.getLocations));

export default router;
