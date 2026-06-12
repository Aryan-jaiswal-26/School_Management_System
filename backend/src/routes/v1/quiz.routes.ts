import { Router } from 'express';
import { QuizController } from '../../controllers/quiz.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { createQuizSchema, submitQuizResponseSchema } from '../../validations/quiz.validation.js';

export const quizRouter = Router();

quizRouter.use(authenticateToken);

// Teacher routes
quizRouter.post('/', requireRoles('TEACHER'), validateRequest(createQuizSchema), QuizController.createQuiz);
quizRouter.get('/teacher', requireRoles('TEACHER'), QuizController.listTeacherQuizzes);
quizRouter.get('/:id/results', requireRoles('TEACHER'), QuizController.getQuizResults);

// Student routes
quizRouter.get('/student', requireRoles('STUDENT'), QuizController.listStudentQuizzes);
quizRouter.post('/:id/respond', requireRoles('STUDENT'), validateRequest(submitQuizResponseSchema), QuizController.submitResponse);

export default quizRouter;
