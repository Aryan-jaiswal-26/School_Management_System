import { Router } from 'express';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  volunteerEvent,
  uploadGallery
} from '../../controllers/events.controller.js';
import {
  createEventSchema,
  updateEventSchema,
} from '../../validations/academics.validation.js';
import { requirePermissions } from '../../middleware/rbac.js';

export const eventsRoutes = Router();

eventsRoutes.use(authenticateToken);

eventsRoutes.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), asyncHandler(getEvents));
eventsRoutes.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_EVENTS'), validateRequest(createEventSchema), asyncHandler(createEvent));
eventsRoutes.patch('/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_EVENTS'), validateRequest(updateEventSchema), asyncHandler(updateEvent));
eventsRoutes.delete('/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_EVENTS'), asyncHandler(deleteEvent));

eventsRoutes.post('/:id/rsvp', requireRoles('PARENT', 'STUDENT', 'TEACHER'), asyncHandler(rsvpEvent));
eventsRoutes.post('/:id/volunteer', requireRoles('PARENT', 'TEACHER'), asyncHandler(volunteerEvent));
eventsRoutes.post('/:id/gallery', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), asyncHandler(uploadGallery));
