import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { Types } from 'mongoose';

/**
 * Middleware that ensures the authenticated user (role SCHOOL_ADMIN) can only act on branches
 * that are listed in their `allowedBranchIds` array. SUPER_ADMIN bypasses this check.
 *
 * Expected to be used after authentication middleware that populates `req.user`.
 */
export function requireAllowedBranch(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  // SUPER_ADMIN has unrestricted access
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Only SCHOOL_ADMIN (or other admin roles) should have allowedBranchIds
  const allowed = (req.user as any).allowedBranchIds as Types.ObjectId[] | undefined;
  if (!allowed || allowed.length === 0) {
    return next(new ApiError(403, 'User has no branch permissions'));
  }

  // Determine target branchId from request (body, params, or query)
  let branchId = req.body.branchId || req.params.branchId || req.query.branchId;
  if (!branchId && req.params.id && (req.baseUrl.includes('/branches') || req.path.includes('/branches'))) {
    branchId = req.params.id;
  }

  if (!branchId) {
    // If the route does not specify a branch, we just continue – the controller/service may handle filtering.
    return next();
  }

  const branchObjId = Types.ObjectId.isValid(branchId) ? new Types.ObjectId(branchId) : null;
  if (!branchObjId) {
    return next(new ApiError(400, 'Invalid branchId provided'));
  }

  const isAllowed = allowed.some((id) => id.equals(branchObjId));
  if (!isAllowed) {
    return next(new ApiError(403, 'User not allowed to access this branch'));
  }

  next();
}

export function extractBranchId(req: Request, _res: Response, next: NextFunction) {
  const headerBranchId = req.headers['x-branch-id'] || req.headers['X-Branch-ID'];
  if (headerBranchId && typeof headerBranchId === 'string' && headerBranchId !== 'null' && headerBranchId !== 'undefined' && headerBranchId !== '') {
    if (!req.query.branchId) req.query.branchId = headerBranchId;
    if (!req.body.branchId) req.body.branchId = headerBranchId;
  }
  next();
}
