import { Router } from 'express';
import { FeedbackController } from '../../controllers/feedback.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const feedbackRouter = Router();
feedbackRouter.use(authenticateToken);

feedbackRouter.get('/',       requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT', 'STUDENT'), asyncHandler(FeedbackController.list));
feedbackRouter.get('/stats',  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(FeedbackController.getStats));
feedbackRouter.post('/',      requireRoles('PARENT', 'STUDENT'),           asyncHandler(FeedbackController.create));
