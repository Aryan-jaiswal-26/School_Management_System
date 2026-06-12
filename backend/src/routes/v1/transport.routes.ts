import { Router } from 'express';
import { TransportController } from '../../controllers/transport.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';

export const transportRouter = Router();

// Ensure all routes require authentication
transportRouter.use(authenticateToken);

transportRouter.get('/drivers', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_TRANSPORT'), TransportController.listDrivers);
transportRouter.get('/driver/dashboard', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.getDriverDashboard);
transportRouter.post('/driver/trips/start', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.startDriverTrip);
transportRouter.post('/driver/trips/end', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.endDriverTrip);
transportRouter.post('/driver/trips/manifest', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.updateManifestStatus);
transportRouter.post('/driver/trips/delay', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.reportDelay);
transportRouter.post('/driver/trips/maintenance', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.reportMaintenance);
transportRouter.post('/driver/trips/sos', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.triggerSos);
transportRouter.post('/driver/attendance', requireRoles('DRIVER', 'SUPER_ADMIN'), TransportController.updateDriverAttendance);
transportRouter.get('/routes', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER'), TransportController.getTransportRoutes);
transportRouter.post('/routes', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_TRANSPORT'), TransportController.createTransportRoute);
transportRouter.patch('/routes/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_TRANSPORT'), TransportController.updateTransportRoute);
transportRouter.patch('/routes/:id/location', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER'), requirePermissions('MANAGE_TRANSPORT'), TransportController.updateGPSLocation);
