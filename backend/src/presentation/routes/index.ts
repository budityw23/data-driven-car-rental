import { Router } from 'express';
import authRoutes from './authRoutes.js';
import carRoutes from './carRoutes.js';
import locationRoutes from './locationRoutes.js';
import addonRoutes from './addonRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Car routes
router.use('/cars', carRoutes);

// Location routes
router.use('/locations', locationRoutes);

// Addon routes
router.use('/addons', addonRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;
