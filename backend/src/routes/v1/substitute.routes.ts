import { Router } from 'express';
import { createAssignment, listAssignments } from '../../controllers/substitute.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

router.post('/', asyncHandler(createAssignment));
router.get('/', asyncHandler(listAssignments));

export default router;
