import { Router } from 'express';
import { LocationController } from '../controllers/LocationController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * GET /api/locations
 * Get all active locations
 * Public
 */
router.get('/', asyncHandler(LocationController.getLocations));

export default router;
