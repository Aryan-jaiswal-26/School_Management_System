import { Router } from 'express';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getLogs,
  getPreApproved,
  getBlacklist,
  createLog,
  checkoutVisitor
} from '../../controllers/visitors.controller.js';

export const visitorsRoutes = Router();

visitorsRoutes.use(authenticateToken);
visitorsRoutes.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

visitorsRoutes.get('/logs', asyncHandler(getLogs));
visitorsRoutes.get('/preapproved', asyncHandler(getPreApproved));
visitorsRoutes.get('/blacklist', asyncHandler(getBlacklist));
visitorsRoutes.post('/logs', asyncHandler(createLog));
visitorsRoutes.put('/logs/:id/checkout', asyncHandler(checkoutVisitor));
