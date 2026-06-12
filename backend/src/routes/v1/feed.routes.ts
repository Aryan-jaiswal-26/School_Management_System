import { Router } from 'express';
import { FeedController } from '../../controllers/feed.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const feedRouter = Router();
feedRouter.use(authenticateToken);

feedRouter.get('/', asyncHandler(FeedController.list));
feedRouter.post('/', asyncHandler(FeedController.create));
feedRouter.post('/:id/like', asyncHandler(FeedController.like));
feedRouter.post('/:id/comment', asyncHandler(FeedController.addComment));
feedRouter.patch(
  '/:id/pin',
  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(FeedController.pin),
);
feedRouter.delete('/:id', asyncHandler(FeedController.delete));
