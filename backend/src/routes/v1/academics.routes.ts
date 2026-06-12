import { Router } from 'express';
import { AcademicsController } from '../../controllers/academics.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireParentChildAccess, requireTeacherStudentAccess } from '../../middleware/resource-isolation.js';
import { requirePermissions } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createClassSchema,
  listClassesQuerySchema,
  updateClassSchema,
  listSectionsQuerySchema,
  createSectionSchema,
  updateSectionSchema,
  listSubjectsQuerySchema,
  createSubjectSchema,
  updateSubjectSchema,
  listTimetableQuerySchema,
  createTimetableSchema,
  updateTimetableSchema,
} from '../../validations/academics.validation.js';

export const academicsRouter = Router();

// Ensure all routes require authentication
academicsRouter.use(authenticateToken);

academicsRouter.post('/grades', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.recordGrade);
academicsRouter.post('/grades/bulk', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.recordGradeBulk);
academicsRouter.get(
  '/grades/student/:studentId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  (req, _res, next) => { (req.params as any).studentId = req.params.studentId; next(); },
  requireParentChildAccess,
  requireTeacherStudentAccess,
  AcademicsController.getStudentGrades,
);
academicsRouter.get('/grades', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('VIEW_ANALYTICS'), AcademicsController.getGradesByTerm);

academicsRouter.get('/subjects', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), AcademicsController.listSubjects);

academicsRouter.get('/syllabus', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), AcademicsController.listSyllabus);

academicsRouter.get('/leads', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.listLeads);
academicsRouter.post('/leads', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.createLead);
academicsRouter.patch('/leads/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.updateLead);

academicsRouter.get('/timetable', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), AcademicsController.listTimetable);
academicsRouter.post('/timetable', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(createTimetableSchema), AcademicsController.createTimetable);

// --- Class / Section / Subject CRUD ---
academicsRouter.get('/classes', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), validateRequest(listClassesQuerySchema), AcademicsController.listClasses);
academicsRouter.post('/classes', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(createClassSchema), AcademicsController.createClass);
academicsRouter.patch('/classes/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(updateClassSchema), AcademicsController.updateClass);
academicsRouter.delete('/classes/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.deleteClass);

academicsRouter.get('/sections', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), validateRequest(listSectionsQuerySchema), AcademicsController.listSections);
academicsRouter.post('/sections', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(createSectionSchema), AcademicsController.createSection);
academicsRouter.patch('/sections/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(updateSectionSchema), AcademicsController.updateSection);
academicsRouter.delete('/sections/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.deleteSection);

academicsRouter.get('/subjects/manage', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), validateRequest(listSubjectsQuerySchema), AcademicsController.listSubjectsPaged);
academicsRouter.post('/subjects', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(createSubjectSchema), AcademicsController.createSubject);
academicsRouter.patch('/subjects/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(updateSubjectSchema), AcademicsController.updateSubject);
academicsRouter.delete('/subjects/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.deleteSubject);

academicsRouter.get('/timetable/manage', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), validateRequest(listTimetableQuerySchema), AcademicsController.listTimetablePaged);
academicsRouter.patch('/timetable/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_ACADEMICS'), validateRequest(updateTimetableSchema), AcademicsController.updateTimetable);
academicsRouter.delete('/timetable/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MANAGE_ACADEMICS'), AcademicsController.deleteTimetable);
