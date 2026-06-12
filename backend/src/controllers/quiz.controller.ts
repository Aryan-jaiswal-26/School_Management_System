import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { QuizResponse } from '../models/QuizResponse.js';
import { Student } from '../models/Student.js';
import { sendResponse } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';

export class QuizController {
  static async createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const teacherId = req.user?.id;
      
      if (!schoolId || !teacherId) {
        throw new ApiError(400, 'Missing user context');
      }

      const { classId, sectionId, question, options, correctOptionIndex } = req.body;

      const quiz = await Quiz.create({
        schoolId: new Types.ObjectId(schoolId),
        teacherId: new Types.ObjectId(teacherId),
        classId: new Types.ObjectId(classId),
        sectionId: sectionId ? new Types.ObjectId(sectionId) : undefined,
        question,
        options,
        correctOptionIndex,
        isActive: true,
      });

      sendResponse(res, 201, 'Quiz created successfully', quiz);
    } catch (error) {
      next(error);
    }
  }

  static async listTeacherQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const teacherId = req.user?.id;

      if (!schoolId || !teacherId) {
        throw new ApiError(400, 'Missing user context');
      }

      const quizzes = await Quiz.find({ 
        schoolId: new Types.ObjectId(schoolId),
        teacherId: new Types.ObjectId(teacherId) 
      })
      .sort({ createdAt: -1 })
      .populate('classId', 'name')
      .populate('sectionId', 'name');

      sendResponse(res, 200, 'Quizzes retrieved', quizzes);
    } catch (error) {
      next(error);
    }
  }

  static async listStudentQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;

      if (!schoolId || !studentId) {
        throw new ApiError(400, 'Missing user context');
      }

      // Find the student's class
      const student = await Student.findOne({ userId: studentId, schoolId });
      if (!student) {
        throw new ApiError(404, 'Student not found');
      }

      // Find active quizzes for this class and optionally section
      const quizzes = await Quiz.find({ 
        schoolId: new Types.ObjectId(schoolId),
        classId: student.classId,
        $or: [
          { sectionId: student.sectionId },
          { sectionId: { $exists: false } },
          { sectionId: null }
        ],
        isActive: true 
      })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'firstName lastName');

      // Check which quizzes the student has already responded to
      const responses = await QuizResponse.find({
        studentId: student._id,
        quizId: { $in: quizzes.map(q => q._id) }
      });

      const respondedQuizIds = new Set(responses.map(r => r.quizId.toString()));
      const responseMap = new Map(responses.map(r => [r.quizId.toString(), r]));

      // Return quizzes mapped with response status
      // Omit correctOptionIndex for unanswered quizzes to prevent cheating
      const mappedQuizzes = quizzes.map(quiz => {
        const hasResponded = respondedQuizIds.has(quiz._id.toString());
        const response = responseMap.get(quiz._id.toString());
        
        return {
          _id: quiz._id,
          question: quiz.question,
          options: quiz.options,
          isActive: quiz.isActive,
          teacherId: quiz.teacherId,
          createdAt: quiz.createdAt,
          hasResponded,
          selectedOptionIndex: response ? response.selectedOptionIndex : null,
          correctOptionIndex: hasResponded ? quiz.correctOptionIndex : null // Only reveal if answered
        };
      });

      sendResponse(res, 200, 'Quizzes retrieved', mappedQuizzes);
    } catch (error) {
      next(error);
    }
  }

  static async submitResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;
      const { id: quizId } = req.params;

      if (!schoolId || !studentId) {
        throw new ApiError(400, 'Missing user context');
      }

      const { selectedOptionIndex } = req.body;

      const quiz = await Quiz.findOne({ _id: quizId, schoolId, isActive: true });
      if (!quiz) {
        throw new ApiError(404, 'Quiz not found or inactive');
      }

      const student = await Student.findOne({ userId: studentId, schoolId });
      if (!student) {
        throw new ApiError(404, 'Student not found');
      }

      // Check if student already responded
      const existingResponse = await QuizResponse.findOne({ quizId, studentId: student._id });
      if (existingResponse) {
        throw new ApiError(400, 'You have already submitted a response for this quiz');
      }

      const response = await QuizResponse.create({
        schoolId: new Types.ObjectId(schoolId),
        quizId: new Types.ObjectId(quizId as string),
        studentId: student._id,
        selectedOptionIndex
      });

      sendResponse(res, 201, 'Response submitted', {
        correctOptionIndex: quiz.correctOptionIndex,
        selectedOptionIndex
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQuizResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const teacherId = req.user?.id;
      const { id: quizId } = req.params;

      if (!schoolId || !teacherId) {
        throw new ApiError(400, 'Missing user context');
      }

      const quiz = await Quiz.findOne({ _id: quizId, schoolId, teacherId });
      if (!quiz) {
        throw new ApiError(404, 'Quiz not found');
      }

      const responses = await QuizResponse.find({ quizId, schoolId })
        .populate({
          path: 'studentId',
          select: 'admissionNumber userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        });

      sendResponse(res, 200, 'Quiz results retrieved', {
        quiz,
        responses
      });
    } catch (error) {
      next(error);
    }
  }
}
