import { Router } from 'express';
import { LiveClassController } from '../../controllers/live-class.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import { createLiveClassSchema, listLiveClassesQuerySchema } from '../../validations/live-class.validation.js';

export const liveClassRouter = Router();

liveClassRouter.use(authenticateToken);

liveClassRouter.get('/', validateRequest(listLiveClassesQuerySchema), asyncHandler(LiveClassController.list));
liveClassRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validateRequest(createLiveClassSchema),
  asyncHandler(LiveClassController.create),
);
liveClassRouter.post('/:id/join', asyncHandler(LiveClassController.join));
