import { Router } from 'express';
import { LessonPlanController } from '../../controllers/lesson-plan.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const lessonPlanRouter = Router();
lessonPlanRouter.use(authenticateToken);

lessonPlanRouter.get('/', asyncHandler(LessonPlanController.list));
lessonPlanRouter.post(
  '/',
  requireRoles('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(LessonPlanController.create),
);
lessonPlanRouter.get('/:id', asyncHandler(LessonPlanController.getById));
lessonPlanRouter.patch(
  '/:id',
  requireRoles('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(LessonPlanController.update),
);
lessonPlanRouter.patch(
  '/:id/submit',
  requireRoles('TEACHER'),
  asyncHandler(LessonPlanController.submit),
);
lessonPlanRouter.patch(
  '/:id/review',
  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(LessonPlanController.review),
);
