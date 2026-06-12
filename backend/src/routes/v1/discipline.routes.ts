import { Router } from 'express';
import { createRecord, getStudentRecords, updateRecord, getAllRecords } from '../../controllers/discipline.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);

router.get('/student/:studentId', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), asyncHandler(getStudentRecords));

router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.post('/', asyncHandler(createRecord));
router.get('/', asyncHandler(getAllRecords));
router.put('/:id', asyncHandler(updateRecord));

export default router;
