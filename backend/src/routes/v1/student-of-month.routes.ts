import { Router } from 'express';
import { StudentOfMonthController } from '../../controllers/student-of-month.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const studentOfMonthRouter = Router();
studentOfMonthRouter.use(authenticateToken);

studentOfMonthRouter.get('/', asyncHandler(StudentOfMonthController.list));
studentOfMonthRouter.get('/month', asyncHandler(StudentOfMonthController.getByMonth));
studentOfMonthRouter.post('/', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), asyncHandler(StudentOfMonthController.create));
studentOfMonthRouter.delete('/:id', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(StudentOfMonthController.delete));
