import { Router } from 'express';
import { getAuditLogs, AuditController } from '../../controllers/audit.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));
router.get('/', getAuditLogs);

export default router;

export const auditRouter = Router();
auditRouter.use(authenticateToken);
auditRouter.get('/logs',        requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(AuditController.getAuditLogs));
auditRouter.get('/activity',    requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(AuditController.getActivityLogs));
auditRouter.get('/my-activity', asyncHandler(AuditController.getMyActivity));

