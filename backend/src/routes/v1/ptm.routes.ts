import { Router } from 'express';
import { PTMController } from '../../controllers/ptm.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const ptmRouter = Router();

ptmRouter.use(authenticateToken);

ptmRouter.get('/', asyncHandler(PTMController.getMeetings));
ptmRouter.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), asyncHandler(PTMController.createMeeting));
ptmRouter.post('/book', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT'), asyncHandler(PTMController.bookSlot));
