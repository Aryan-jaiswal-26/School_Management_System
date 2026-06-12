import { Router } from 'express';
import { getAuditLogs } from '../../controllers/audit.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

router.get('/', getAuditLogs);

export default router;
