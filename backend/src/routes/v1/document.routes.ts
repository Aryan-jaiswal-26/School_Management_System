import { Router } from 'express';
import { generateOfferLetter, generateIdCard, generateTransferCertificate } from '../../controllers/document.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));

router.get('/offer-letter/:candidateId', asyncHandler(generateOfferLetter));
router.get('/id-card/:studentId', asyncHandler(generateIdCard));
router.get('/tc/:studentId', asyncHandler(generateTransferCertificate));

export default router;
