import { Router } from "express";
import { authenticateToken, requireRoles } from "../../middleware/auth.js";
import { requirePermissions } from "../../middleware/rbac.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { RBACController } from "../../controllers/rbac.controller.js";

export const rbacRouter = Router();

rbacRouter.use(authenticateToken);

rbacRouter.get(
  "/permissions",
  requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "ADMIN"),
  requirePermissions("MANAGE_USERS"),
  asyncHandler(RBACController.listPermissions),
);

rbacRouter.get(
  "/roles",
  requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "ADMIN"),
  requirePermissions("MANAGE_USERS"),
  asyncHandler(RBACController.listRoles),
);

rbacRouter.put(
  "/roles/:name/permissions",
  requireRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "ADMIN"),
  requirePermissions("MANAGE_USERS"),
  asyncHandler(RBACController.updateRolePermissions),
);
