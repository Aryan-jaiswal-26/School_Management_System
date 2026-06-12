import { Router } from 'express';
import { EmployeeController } from '../../controllers/employee.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { upload } from '../../middleware/upload.js';
import {
  hireEmployeeSchema,
  updateEmployeeSchema,
  markAttendanceSchema,
  leaveRequestSchema,
  reviewLeaveRequestSchema,
  generateSalarySchema,
  employeeListQuerySchema
} from '../../validations/employee.validation.js';

export const employeeRouter = Router();

// Ensure all routes require authentication
employeeRouter.use(authenticateToken);

// --- Hiring & Profiles ---
employeeRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(hireEmployeeSchema),
  EmployeeController.hireEmployee
);

employeeRouter.get(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(employeeListQuerySchema),
  EmployeeController.listEmployees
);

employeeRouter.get(
  '/:id',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'),
  requirePermissions('MANAGE_HR'),
  EmployeeController.getEmployeeProfile
);

employeeRouter.patch(
  '/:id',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(updateEmployeeSchema),
  EmployeeController.updateEmployee
);

// --- Attendance ---
employeeRouter.post(
  '/attendance/bulk',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(markAttendanceSchema),
  EmployeeController.markAttendance
);

// --- Leaves ---
employeeRouter.post(
  '/leaves',
  requireRoles('TEACHER', 'DRIVER', 'ACCOUNTANT', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(leaveRequestSchema),
  EmployeeController.requestLeave
);

employeeRouter.patch(
  '/leaves/:id/status',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  validateRequest(reviewLeaveRequestSchema),
  EmployeeController.reviewLeave
);

// --- Salary ---
employeeRouter.post(
  '/salaries/generate',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_HR'),
  validateRequest(generateSalarySchema),
  EmployeeController.generateSalary
);

// --- Documents ---
employeeRouter.post(
  '/:id/documents',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_HR'),
  upload.single('document'),
  EmployeeController.uploadDocument
);
