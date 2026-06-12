import { Router } from 'express';
import { exportStudentsExcel, exportStudentsPdf } from '../../controllers/export.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.get('/students/excel', asyncHandler(exportStudentsExcel));
router.get('/students/pdf', asyncHandler(exportStudentsPdf));

export default router;
