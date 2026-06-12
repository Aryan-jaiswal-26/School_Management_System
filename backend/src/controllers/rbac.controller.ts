import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response.js";
import { RBACService } from "../services/rbac.service.js";
import { logAuditEvent } from "../utils/audit.js";

export class RBACController {
  static async listPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await RBACService.listPermissions();
      sendResponse(res, 200, "Permissions retrieved successfully", permissions);
    } catch (error) {
      next(error);
    }
  }

  static async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (req.user?.schoolId || req.query.schoolId || "") as string;
      const roles = await RBACService.listRoles(schoolId);
      sendResponse(res, 200, "Roles retrieved successfully", roles);
    } catch (error) {
      next(error);
    }
  }

  static async updateRolePermissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const schoolId = (req.user?.schoolId ||
        req.body.schoolId ||
        req.query.schoolId ||
        "") as string;
      const permissionIds = Array.isArray(req.body.permissionIds) ? req.body.permissionIds : [];
      const role = await RBACService.updateRolePermissions(
        schoolId,
        String(req.params.name),
        permissionIds,
        req.user?.id,
      );
      // Audit log entry for permission update
      await logAuditEvent(
        req,
        'UPDATE_ROLE_PERMISSIONS',
        'RBAC',
        req.params.name,
        { after: { permissionIds } }
      );
      sendResponse(res, 200, "Role permissions updated successfully", role);
    } catch (error) {
      next(error);
    }
  }
}
