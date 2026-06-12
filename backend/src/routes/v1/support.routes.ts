import { Router } from 'express';
import { SupportController } from '../../controllers/support.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const supportRouter = Router();
supportRouter.use(authenticateToken);

supportRouter.get('/',                asyncHandler(SupportController.list));
supportRouter.post('/',               asyncHandler(SupportController.create));
supportRouter.get('/:id',             asyncHandler(SupportController.getById));
supportRouter.post('/:id/messages',   asyncHandler(SupportController.addMessage));
