import { Router } from 'express';
import { AddonController } from '../controllers/AddonController.js';
import { asyncHandler } from '../middlewares/index.js';

const router = Router();

/**
 * GET /api/addons
 * Get all active addons
 * Public
 */
router.get('/', asyncHandler(AddonController.getAddons));

export default router;
