import { Router } from 'express';
import * as BranchController from '../../controllers/branch.controller.js';
import { authenticateToken as requireAuth } from '../../middleware/auth.js';
import { requireRoles } from '../../middleware/auth.js';
import { requireAllowedBranch } from '../../middleware/branchAccess.js';

const router = Router();

// All routes require authentication and admin roles (SUPER_ADMIN or SCHOOL_ADMIN)
router.use(requireAuth);
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));

// CRUD operations
router.post('/', BranchController.createBranch);
router.get('/', BranchController.listBranches);
router.get('/:id', BranchController.getBranch);
router.put('/:id', BranchController.updateBranch);
router.delete('/:id', BranchController.deleteBranch);
router.patch('/:id/activate', BranchController.activateBranch);
router.patch('/:id/deactivate', BranchController.deactivateBranch);

// Assignment – ensure the user is allowed to act on the target branch
router.post('/:id/assign', requireAllowedBranch, BranchController.assignEntityToBranch);

// Analytics – ensure the user is allowed to act on the target branch
router.get('/:id/analytics', requireAllowedBranch, BranchController.getBranchAnalytics);

export default router;
