import { Router } from 'express';
import { getStudentOnboarding, updateOnboardingStep } from '../../controllers/onboarding.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.get('/:studentId', asyncHandler(getStudentOnboarding));
router.put('/:studentId/step', asyncHandler(updateOnboardingStep));

export default router;
