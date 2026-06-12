import { Router } from 'express';
import { generateApiKey, listApiKeys, revokeApiKey } from '../../controllers/api-key.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

const router = Router();

// Only school admins (SUPER_ADMIN or ADMIN) can manage API keys
router.use(authenticateToken);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

router.post('/generate', generateApiKey);
router.get('/', listApiKeys);
router.put('/:id/revoke', revokeApiKey);

export default router;
