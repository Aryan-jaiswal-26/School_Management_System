import { Router } from 'express';
import { CertificateController } from '../../controllers/certificate.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const certificateRouter = Router();
certificateRouter.use(authenticateToken);

certificateRouter.get('/', asyncHandler(CertificateController.list));
certificateRouter.post('/', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), asyncHandler(CertificateController.create));
certificateRouter.get('/:id', asyncHandler(CertificateController.getById));
certificateRouter.get('/:id/download', asyncHandler(CertificateController.download));
certificateRouter.patch('/:id/revoke', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(CertificateController.revoke));
