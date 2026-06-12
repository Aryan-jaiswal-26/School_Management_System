import { Router } from 'express';
import { HomeworkController } from '../../controllers/homework.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { gradeSubmissionSchema } from '../../validations/homework.validation.js';
import {
  createHomeworkSchema,
  submitHomeworkSchema,
  uploadStudyMaterialSchema,
} from '../../validations/homework.validation.js';

export const homeworkRouter = Router();

homeworkRouter.use(authenticateToken);

homeworkRouter.post(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validateRequest(createHomeworkSchema),
  HomeworkController.createHomework
);

homeworkRouter.get('/', HomeworkController.listHomework);

homeworkRouter.post(
  '/:homeworkId/submit',
  requireRoles('STUDENT', 'PARENT'),
  upload.single('file'),
  validateRequest(submitHomeworkSchema),
  HomeworkController.submitHomework
);

homeworkRouter.get(
  '/:homeworkId/submissions',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  HomeworkController.listSubmissions
);

homeworkRouter.post(
  '/:homeworkId/submissions/:submissionId/grade',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validateRequest(gradeSubmissionSchema),
  HomeworkController.gradeSubmission
);

homeworkRouter.post(
  '/materials',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  upload.single('file'),
  validateRequest(uploadStudyMaterialSchema),
  HomeworkController.uploadStudyMaterial
);

homeworkRouter.get('/materials', HomeworkController.listStudyMaterials);
homeworkRouter.get('/syllabus', HomeworkController.getSyllabusTracking);
