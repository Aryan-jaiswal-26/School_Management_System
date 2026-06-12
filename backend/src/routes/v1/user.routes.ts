import { Router } from 'express';
import { UserController } from '../../controllers/user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';

export const userRouter = Router();

// Ensure all routes require authentication
userRouter.use(authenticateToken);

userRouter.get('/parents', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_STUDENTS'), UserController.listParents);
userRouter.get('/:id', UserController.getUserProfile);
userRouter.get('/', UserController.getAllProfiles);
