import { Router } from 'express';
import { generateTaxInvoice } from '../../controllers/invoice.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'));

router.get('/:paymentId/pdf', asyncHandler(generateTaxInvoice));

export default router;
