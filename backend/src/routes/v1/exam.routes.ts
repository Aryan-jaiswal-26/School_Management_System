import { Router } from 'express';
import { ExamController } from '../../controllers/exam.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireParentChildAccess, requireTeacherStudentAccess } from '../../middleware/resource-isolation.js';
import { requirePermissions } from '../../middleware/rbac.js';
import {
  createExamSchema,
  updateExamStatusSchema,
  publishResultsSchema,
  bulkMarksEntrySchema
} from '../../validations/exam.validation.js';

export const examRouter = Router();

// Require authentication for all routes
examRouter.use(authenticateToken);

// --- Exam Scheduling & Management (Admins & Teachers) ---
examRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('MANAGE_EXAMS'),
  validateRequest(createExamSchema),
  ExamController.createExam
);

examRouter.get(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  ExamController.listExams
);

examRouter.patch(
  '/:examId/status',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_EXAMS'),
  validateRequest(updateExamStatusSchema),
  ExamController.updateExamStatus
);

examRouter.post(
  '/:examId/publish',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_EXAMS'),
  validateRequest(publishResultsSchema),
  ExamController.publishResults
);

// --- Marks Entry (Teachers & Admins) ---
examRouter.post(
  '/:examId/marks/bulk',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('MANAGE_EXAMS'),
  validateRequest(bulkMarksEntrySchema),
  ExamController.bulkEnterMarks
);

// --- Reporting & Analytics ---
// Teacher/Admin views aggregate analytics for a subject
examRouter.get(
  '/:examId/analytics/:subjectId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  requirePermissions('VIEW_ANALYTICS'),
  ExamController.getSubjectAnalytics
);

// Student/Parent views their specific report card
// Admins and Teachers can also view any report card
examRouter.get(
  '/:examId/report-card/:studentId',
  requireParentChildAccess,
  requireTeacherStudentAccess,
  ExamController.generateReportCard
);
