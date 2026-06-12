import { Router } from 'express';
import { EmergencyController } from '../../controllers/emergency.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import { createEmergencyAlertSchema } from '../../validations/emergency.validation.js';

export const emergencyRouter = Router();

emergencyRouter.use(authenticateToken);

emergencyRouter.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), asyncHandler(EmergencyController.list));
emergencyRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'DRIVER'),
  validateRequest(createEmergencyAlertSchema),
  asyncHandler(EmergencyController.create),
);
emergencyRouter.patch('/:id/acknowledge', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), asyncHandler(EmergencyController.acknowledge));
