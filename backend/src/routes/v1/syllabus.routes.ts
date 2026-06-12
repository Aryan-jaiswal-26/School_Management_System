import { Router } from 'express';
import { SyllabusController } from '../../controllers/syllabus.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

export const syllabusRouter = Router();

// Ensure all routes require authentication
syllabusRouter.use(authenticateToken);

syllabusRouter.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), SyllabusController.listSyllabus);
syllabusRouter.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), SyllabusController.createSyllabus);
syllabusRouter.patch('/:id', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), SyllabusController.updateSyllabus);
