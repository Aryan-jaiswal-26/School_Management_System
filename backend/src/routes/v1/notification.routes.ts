import { Router } from 'express';
import { NotificationController } from '../../controllers/notification.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createNotificationSchema } from '../../validations/notification.validation.js';

export const notificationRouter = Router();

notificationRouter.use(authenticateToken);

notificationRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('MANAGE_COMMUNICATIONS'),
  validateRequest(createNotificationSchema),
  NotificationController.sendNotification,
);

notificationRouter.post(
  '/announce',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('MANAGE_COMMUNICATIONS'),
  validateRequest(createNotificationSchema),
  NotificationController.broadcastAnnouncement,
);

notificationRouter.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER'), NotificationController.listNotifications);
notificationRouter.patch('/:notificationId/read', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER'), NotificationController.markAsRead);

// Announcements
notificationRouter.get('/announcements', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER'), NotificationController.getAnnouncements);
notificationRouter.post('/announcements', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_COMMUNICATIONS'), NotificationController.createAnnouncement);
notificationRouter.delete('/announcements/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_COMMUNICATIONS'), NotificationController.deleteAnnouncement);

export default notificationRouter;
