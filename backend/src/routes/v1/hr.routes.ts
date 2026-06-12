import { Router } from 'express';
import { HRController } from '../../controllers/hr.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

export const hrRouter = Router();

// Ensure all routes require authentication
hrRouter.use(authenticateToken);

hrRouter.post('/leaves', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'DRIVER', 'ACCOUNTANT'), HRController.createLeaveRequest);
hrRouter.get('/leaves', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'DRIVER', 'ACCOUNTANT'), HRController.getLeaveRequests);
hrRouter.post('/leaves/:id/approve', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), HRController.approveLeaveRequest);
hrRouter.patch('/leaves/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), HRController.updateLeaveStatus);
