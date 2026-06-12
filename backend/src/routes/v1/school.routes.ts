import { Router } from 'express';
import { SchoolController } from '../../controllers/school.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireSchoolAccess } from '../../middleware/rbac.js';
import { requirePermissions } from '../../middleware/rbac.js';
import {
  createSchoolSchema,
  updateSchoolSchema,
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createSemesterSchema,
  updateSemesterSchema,
  createBranchSchema,
  updateBranchSchema,
  paginationQuerySchema
} from '../../validations/school.validation.js';

export const schoolRouter = Router();

// --- Top-Level School Routes ---
// Only SUPER_ADMIN can create/delete/list schools globally
schoolRouter.post(
  '/',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(createSchoolSchema),
  SchoolController.createSchool
);

schoolRouter.get(
  '/',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  validateRequest(paginationQuerySchema),
  SchoolController.listSchools
);

// Individual school details & settings
schoolRouter.get(
  '/:id',
  authenticateToken,
  // requireSchoolAccess handles ensuring users can only fetch their own school details
  (req, res, next) => { (req.params as any).schoolId = req.params.id; next(); },
  requireSchoolAccess,
  SchoolController.getSchoolById
);

schoolRouter.patch(
  '/:id',
  authenticateToken,
  (req, res, next) => { (req.params as any).schoolId = req.params.id; next(); },
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(updateSchoolSchema),
  SchoolController.updateSchool
);

schoolRouter.delete(
  '/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  SchoolController.deleteSchool
);

// --- Nested School Routes (Academic Years, Branches, Semesters) ---
// All require SCHOOL_ADMIN or SUPER_ADMIN for mutations. Reads allow other roles depending on requirements.

// Academic Years
schoolRouter.post(
  '/:schoolId/academic-years',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(createAcademicYearSchema),
  SchoolController.createAcademicYear
);

schoolRouter.get(
  '/:schoolId/academic-years',
  authenticateToken,
  requireSchoolAccess,
  validateRequest(paginationQuerySchema),
  SchoolController.listAcademicYears
);

schoolRouter.patch(
  '/:schoolId/academic-years/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(updateAcademicYearSchema),
  SchoolController.updateAcademicYear
);

schoolRouter.delete(
  '/:schoolId/academic-years/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  SchoolController.deleteAcademicYear
);

// Semesters
schoolRouter.post(
  '/:schoolId/semesters',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(createSemesterSchema),
  SchoolController.createSemester
);

schoolRouter.get(
  '/:schoolId/semesters',
  authenticateToken,
  requireSchoolAccess,
  validateRequest(paginationQuerySchema),
  SchoolController.listSemesters
);

schoolRouter.patch(
  '/:schoolId/semesters/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(updateSemesterSchema),
  SchoolController.updateSemester
);

schoolRouter.delete(
  '/:schoolId/semesters/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  SchoolController.deleteSemester
);

// Terms alias for semesters
schoolRouter.post(
  '/:schoolId/terms',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(createSemesterSchema),
  SchoolController.createSemester
);

schoolRouter.get(
  '/:schoolId/terms',
  authenticateToken,
  requireSchoolAccess,
  validateRequest(paginationQuerySchema),
  SchoolController.listSemesters
);

schoolRouter.patch(
  '/:schoolId/terms/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(updateSemesterSchema),
  SchoolController.updateSemester
);

schoolRouter.delete(
  '/:schoolId/terms/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  SchoolController.deleteSemester
);

// Branches
schoolRouter.post(
  '/:schoolId/branches',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(createBranchSchema),
  SchoolController.createBranch
);

schoolRouter.get(
  '/:schoolId/branches',
  authenticateToken,
  requireSchoolAccess,
  validateRequest(paginationQuerySchema),
  SchoolController.listBranches
);

schoolRouter.patch(
  '/:schoolId/branches/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  validateRequest(updateBranchSchema),
  SchoolController.updateBranch
);

schoolRouter.delete(
  '/:schoolId/branches/:id',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_SCHOOL'),
  SchoolController.deleteBranch
);

schoolRouter.post(
  '/:schoolId/subscribe',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  SchoolController.subscribeSchool
);

schoolRouter.get(
  '/:schoolId/subscription',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  SchoolController.getSchoolSubscription
);

schoolRouter.get(
  '/:schoolId/invoices',
  authenticateToken,
  requireSchoolAccess,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  SchoolController.getSchoolInvoices
);
