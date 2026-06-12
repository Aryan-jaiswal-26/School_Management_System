import { Router } from 'express';
import { StudentController } from '../../controllers/student.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireParentChildAccess, requireTeacherStudentAccess } from '../../middleware/resource-isolation.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { upload } from '../../middleware/upload.js';
import {
  admitStudentSchema,
  updateStudentSchema,
  assignClassSchema,
  requestTcSchema,
  issueTcSchema,
  studentListQuerySchema
} from '../../validations/student.validation.js';

export const studentRouter = Router();

// Ensure all routes require authentication
studentRouter.use(authenticateToken);

// --- Admission & Creation (Admins only) ---
studentRouter.post(
  '/admission',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  validateRequest(admitStudentSchema),
  StudentController.admitStudent
);

import { markStudentAttendanceSchema } from '../../validations/attendance.validation.js';
import { AttendanceController } from '../../controllers/attendance.controller.js';

// --- Attendance (Teachers/Admins) ---
studentRouter.post(
  '/attendance/bulk',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('MARK_ATTENDANCE'),
  validateRequest(markStudentAttendanceSchema),
  AttendanceController.recordAttendanceBulk
);

// --- Listing Students ---
// Admins and teachers can list students (Teachers might only see their own class, handled dynamically or via UI filtering for now)
studentRouter.get(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('VIEW_STUDENT'),
  validateRequest(studentListQuerySchema),
  StudentController.listStudents
);

// --- Student Profile & Read (Admin, Teacher, or Parent/Student with isolation) ---
studentRouter.get(
  '/:id',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  (req, res, next) => { (req.params as any).studentId = req.params.id; next(); },
  requireParentChildAccess,
  requireTeacherStudentAccess,
  StudentController.getStudentProfile
);

// --- Updates (Admins only) ---
studentRouter.patch(
  '/:id',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  validateRequest(updateStudentSchema),
  StudentController.updateStudent
);

studentRouter.delete(
  '/:id',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  StudentController.deleteStudent
);

studentRouter.post(
  '/:id/restore',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  StudentController.restoreStudent
);

studentRouter.patch(
  '/:id/assign-class',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  validateRequest(assignClassSchema),
  StudentController.assignClassAndSection
);

// --- Transfer Certificate ---
studentRouter.post(
  '/:id/transfer-certificate/request',
  // Parents or Admins can request TC
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT', 'STUDENT'),
  (req, res, next) => { (req.params as any).studentId = req.params.id; next(); },
  requireParentChildAccess,
  requirePermissions('VIEW_STUDENT'),
  validateRequest(requestTcSchema),
  StudentController.requestTransferCertificate
);

studentRouter.post(
  '/:id/transfer-certificate/issue',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  validateRequest(issueTcSchema),
  StudentController.issueTransferCertificate
);

// --- Documents ---
studentRouter.post(
  '/:id/documents',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_STUDENTS'),
  upload.single('document'), // multer middleware
  StudentController.uploadDocument
);

studentRouter.get(
  '/:id/documents',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  (req, res, next) => { (req.params as any).studentId = req.params.id; next(); },
  requireParentChildAccess,
  requireTeacherStudentAccess,
  StudentController.listDocuments
);
