import { Router } from 'express';
import { SafetyController } from '../../controllers/safety.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const safetyRouter = Router();
safetyRouter.use(authenticateToken);

// ─── Emergency Drills ─────────────────────────────────────────────────────────
safetyRouter.get('/drills', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), asyncHandler(SafetyController.listDrills));
safetyRouter.post('/drills', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.createDrill));
safetyRouter.patch('/drills/:id', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.updateDrill));

// ─── Missing Student Alerts ───────────────────────────────────────────────────
safetyRouter.get('/missing-students', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), asyncHandler(SafetyController.listMissingAlerts));
safetyRouter.post('/missing-students', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'), asyncHandler(SafetyController.createMissingAlert));
safetyRouter.patch('/missing-students/:id/resolve', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.resolveMissingAlert));

// ─── Lockdown Alerts ──────────────────────────────────────────────────────────
safetyRouter.get('/lockdowns', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.listLockdowns));
safetyRouter.post('/lockdowns', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.issueLockdown));
safetyRouter.patch('/lockdowns/:id/lift', requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'), asyncHandler(SafetyController.liftLockdown));
