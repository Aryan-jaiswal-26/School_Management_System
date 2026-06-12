import { Router } from 'express';
import { checkout, webhook, refund } from '../../controllers/payment-gateway.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

// Webhook doesn't require standard auth token, but signature validation (mocked)
router.post('/webhook', asyncHandler(webhook));

router.use(authenticateToken);

// Checkout can be initiated by parents or students
router.post('/checkout', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT', 'STUDENT'), asyncHandler(checkout));

// Refunds only by admins
router.post('/:paymentId/refund', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'), asyncHandler(refund));

export default router;
