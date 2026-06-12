import type { Request, Response, NextFunction } from 'express';
import { ExamService } from '../services/exam.service.js';
import { sendResponse } from '../utils/response.js';
import { Student } from '../models/Student.js';

export class ExamController {
  static async createExam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const exam = await ExamService.createExam(schoolId, req.body);
      sendResponse(res, 201, 'Exam created successfully', exam);
    } catch (error) {
      next(error);
    }
  }

  static async listExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      let classId = req.query.classId as string;
      if (!classId && req.query.studentId) {
        const student = await Student.findById(req.query.studentId);
        if (student) {
          classId = student.classId?.toString();
        }
      }
      const exams = await ExamService.listExams(schoolId, classId);
      sendResponse(res, 200, 'Exams retrieved successfully', exams);
    } catch (error) {
      next(error);
    }
  }

  static async updateExamStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const examId = req.params.examId as string;
      const exam = await ExamService.updateExamStatus(schoolId, examId, req.body.status);
      sendResponse(res, 200, 'Exam status updated', exam);
    } catch (error) {
      next(error);
    }
  }

  static async publishResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const examId = req.params.examId as string;
      const result = await ExamService.publishResults(schoolId, examId);
      sendResponse(res, 200, 'Results published successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkEnterMarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const examId = req.params.examId as string;
      const result = await ExamService.bulkEnterMarks(schoolId, examId, req.body);
      sendResponse(res, 200, 'Marks recorded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async generateReportCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const examId = req.params.examId as string;
      const studentId = req.params.studentId as string;
      const role = req.user?.role as string;
      const report = await ExamService.generateReportCard(
        schoolId, 
        examId, 
        studentId,
        role
      );
      sendResponse(res, 200, 'Report card generated', report);
    } catch (error) {
      next(error);
    }
  }

  static async getSubjectAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const examId = req.params.examId as string;
      const subjectId = req.params.subjectId as string;
      const analytics = await ExamService.getSubjectAnalytics(
        schoolId, 
        examId, 
        subjectId
      );
      sendResponse(res, 200, 'Subject analytics retrieved', analytics);
    } catch (error) {
      next(error);
    }
  }
}
