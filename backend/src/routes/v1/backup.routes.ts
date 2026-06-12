import { Router } from 'express';
import { triggerBackup, listBackups, restoreBackup } from '../../controllers/backup.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

// Only SUPER_ADMIN can manage backups for security reasons
router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN'));

router.post('/trigger', asyncHandler(triggerBackup));
router.get('/', asyncHandler(listBackups));
router.post('/restore', asyncHandler(restoreBackup));

export default router;
