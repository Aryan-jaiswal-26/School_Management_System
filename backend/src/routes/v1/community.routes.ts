import { Router } from 'express';
import { CommunityController } from '../../controllers/community.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const communityRouter = Router();
communityRouter.use(authenticateToken);

communityRouter.get('/',    asyncHandler(CommunityController.list));
communityRouter.post('/',   requireRoles('PARENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(CommunityController.create));
communityRouter.post('/:id/reply', asyncHandler(CommunityController.addReply));
communityRouter.post('/:id/like',  asyncHandler(CommunityController.likePost));
communityRouter.delete('/:id',     asyncHandler(CommunityController.delete));
