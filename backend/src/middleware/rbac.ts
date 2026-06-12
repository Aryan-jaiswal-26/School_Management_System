import type { NextFunction, Request, Response } from "express";
import { Role } from "../models/Role.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Middleware to check if the authenticated user has the required permissions.
 * SUPER_ADMIN bypasses this check automatically.
 * 
 * @param requiredPermissions Array of permission names required (e.g., 'CREATE_STUDENT')
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Bypass permission checks in development mode for easier testing
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    try {
      if (!req.user) {
        return next(new ApiError(401, "Authentication required"));
      }

      // SUPER_ADMIN has god-mode, bypass all permission checks
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      if (!req.user.schoolId) {
        return next(new ApiError(403, "User is not associated with a school"));
      }

      // Fetch the role for the user's school and populate permissions
      const roleDoc = await Role.findOne({ 
        name: req.user.role.toUpperCase(), 
        schoolId: req.user.schoolId 
      }).populate('permissions');

      if (!roleDoc) {
        // If role configuration is missing, allow access in development mode
        // You may replace this with stricter behavior in production.
        console.warn(`Role configuration not found for ${req.user.role} in school ${req.user.schoolId}. Skipping permission check.`);
        return next();
      }

      // Skip permission check if there are no permissions defined for the role
      if (!roleDoc.permissions || (roleDoc.permissions as any[]).length === 0) {
        console.log(`RBAC DBG: User ${req.user.email} (${req.user.role}) has no permissions in roleDoc. Skipping.`);
        return next();
      }

      // Extract permission names
      const userPermissions = (roleDoc.permissions as any[]).map(p => p.name);
      console.log(`RBAC DBG: User ${req.user.email} (${req.user.role}), required: [${requiredPermissions.join(', ')}], user has: [${userPermissions.join(', ')}]`);

      // Check if user has ANY of the required permissions (more permissive)
      const hasRequiredPermission = requiredPermissions.some(rp => userPermissions.includes(rp));

      if (!hasRequiredPermission) {
        console.log(`RBAC DBG: Insufficient permissions for user ${req.user.email}. Denied.`);
        return next(new ApiError(403, "Insufficient permissions to perform this action"));
      }

      next();
    } catch (error) {
      console.error("RBAC DBG: Error verifying permissions:", error);
      next(new ApiError(500, "Error verifying permissions"));
    }
  };
}

/**
 * Middleware to ensure the user can only access resources belonging to their school.
 * SUPER_ADMIN can access any school.
 * 
 * It expects the schoolId to be present in either req.params.schoolId or req.body.schoolId.
 */
export function requireSchoolAccess(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const targetSchoolId = req.params.schoolId || req.body.schoolId;

  if (!targetSchoolId) {
    // If route doesn't specify schoolId, we could optionally append the user's schoolId to the query/body.
    // But for explicit checks, if it's missing, we let it pass OR block. 
    // Usually, you'd force all requests to be school-scoped.
    return next(new ApiError(400, "School ID is required for this request"));
  }

  if (targetSchoolId.toString() !== req.user.schoolId) {
    return next(new ApiError(403, "Access denied: Resource belongs to a different school"));
  }

  next();
}
