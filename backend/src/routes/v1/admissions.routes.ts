import { Router } from 'express';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getApplications,
  getMyApplications,
  createApplication,
  updateApplicationStatus,
  getWaitlist,
  generateOfferLetter
} from '../../controllers/admissions.controller.js';

export const admissionsRoutes = Router();

admissionsRoutes.use(authenticateToken);

admissionsRoutes.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(getApplications));
admissionsRoutes.get('/waitlist', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(getWaitlist));
admissionsRoutes.get('/my-applications', asyncHandler(getMyApplications));
admissionsRoutes.post('/', asyncHandler(createApplication));
admissionsRoutes.put('/:id/status', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(updateApplicationStatus));
admissionsRoutes.get('/:id/offer-letter', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(generateOfferLetter));
