import { Router } from 'express';
import { TeacherController } from '../../controllers/teacher.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

export const teacherRouter = Router();

// All teacher routes require authentication
teacherRouter.use(authenticateToken);

teacherRouter.get('/profile', TeacherController.getTeacherProfile);
teacherRouter.patch('/profile', TeacherController.updateTeacherProfile);
teacherRouter.get('/timetable', TeacherController.getTeacherTimetable);
teacherRouter.get('/:id/exams', TeacherController.getExamInsights);


