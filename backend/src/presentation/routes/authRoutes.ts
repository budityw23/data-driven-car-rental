import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { asyncHandler, authenticate, validateBody, authLimiter } from '../middlewares/index.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(AuthController.register)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(AuthController.login)
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(AuthController.getProfile)
);

export default router;
