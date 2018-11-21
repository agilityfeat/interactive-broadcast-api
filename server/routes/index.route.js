import express from 'express';
import adminRoutes from './admin.route';
import authRoutes from './auth.route';
import eventRoutes from './event.route';
import viewerRoutes from './viewer.route';

const router = express.Router(); // eslint-disable-line new-cap
// mount admin routes at /admin
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/event', eventRoutes);
router.use('/viewer', viewerRoutes);

export default router;
