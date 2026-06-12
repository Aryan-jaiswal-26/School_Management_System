import { Router } from 'express';
import { createNewsletter, listNewsletters, generateNewsletterPdf } from '../../controllers/newsletter.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
// Students/Parents can read newsletters, but only admins/teachers can create
router.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), asyncHandler(createNewsletter));
router.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), asyncHandler(listNewsletters));
router.get('/:id/pdf', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), asyncHandler(generateNewsletterPdf));

export default router;
