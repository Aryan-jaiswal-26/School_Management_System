import { Router } from 'express';
import { AnalyticsController } from '../../controllers/analytics.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';

export const analyticsRouter = Router();

// Ensure all routes require authentication
analyticsRouter.use(authenticateToken);

analyticsRouter.get('/dashboard', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('VIEW_ANALYTICS'), AnalyticsController.getDashboardStats);
analyticsRouter.get('/teacher-dashboard', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('VIEW_ANALYTICS'), AnalyticsController.getTeacherDashboardStats);
