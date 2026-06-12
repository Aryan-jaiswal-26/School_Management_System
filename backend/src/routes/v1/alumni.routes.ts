import { Router } from 'express';
import { createAlumni, listAlumni, updateAlumni } from '../../controllers/alumni.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.post('/', asyncHandler(createAlumni));
router.get('/', asyncHandler(listAlumni));
router.put('/:id', asyncHandler(updateAlumni));

export default router;
