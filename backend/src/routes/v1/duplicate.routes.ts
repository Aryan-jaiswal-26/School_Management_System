import { Router } from 'express';
import { checkStudentDuplicates, findDuplicateRecords } from '../../controllers/duplicate-detection.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.post('/check', asyncHandler(checkStudentDuplicates));
router.get('/report', asyncHandler(findDuplicateRecords));

export default router;
