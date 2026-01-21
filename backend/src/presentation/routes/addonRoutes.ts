import { Router } from 'express';
import { AddonController } from '../controllers/AddonController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * @swagger
 * /api/addons:
 *   get:
 *     tags: [Addons]
 *     summary: Get all active addons
 *     description: Retrieve all available rental addons (GPS, child seat, etc.)
 *     responses:
 *       200:
 *         description: List of active addons
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
 *                     $ref: '#/components/schemas/Addon'
 */
router.get('/', asyncHandler(AddonController.getAddons));

export default router;
