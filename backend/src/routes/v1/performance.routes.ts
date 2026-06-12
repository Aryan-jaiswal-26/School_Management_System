import { Router } from 'express';
import { createReview, listReviews } from '../../controllers/performance.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

router.post('/', asyncHandler(createReview));
router.get('/', asyncHandler(listReviews));

export default router;
