import type { Request, Response, NextFunction } from 'express';
import { ExamService } from '../services/exam.service.js';
import { sendResponse } from '../utils/response.js';
import { Student } from '../models/Student.js';
import { Exam } from '../models/Exam.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/api-error.js';

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

      if (req.user?.role === 'TEACHER') {
        const employee = await Employee.findOne({
          userId: req.user.id,
          schoolId,
          isDeleted: { $ne: true }
        }).select('classAssignment');

        if (!employee) {
          throw new ApiError(403, 'Teacher profile not found');
        }

        const assignedClasses = employee.classAssignment || [];

        if (classId) {
          const isAssigned = assignedClasses.some((id) => id.toString() === classId);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        } else {
          classId = { $in: assignedClasses.map((id) => id.toString()) } as any;
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

      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      if (req.user?.role === 'TEACHER') {
        const employee = await Employee.findOne({
          userId: req.user.id,
          schoolId,
          isDeleted: { $ne: true }
        }).select('classAssignment');

        if (!employee) {
          throw new ApiError(403, 'Teacher profile not found');
        }

        const assignedClasses = employee.classAssignment || [];
        const isAssigned = assignedClasses.some((id) => id.toString() === exam.classId?.toString());

        if (!isAssigned) {
          throw new ApiError(403, 'Access denied: You cannot enter marks for an exam of a class you are not assigned to');
        }
      }

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

      if (req.user?.role === 'TEACHER') {
        const student = await Student.findById(studentId);
        if (!student) {
          throw new ApiError(404, 'Student not found');
        }

        const employee = await Employee.findOne({
          userId: req.user.id,
          schoolId,
          isDeleted: { $ne: true }
        }).select('classAssignment');

        if (!employee) {
          throw new ApiError(403, 'Teacher profile not found');
        }

        const assignedClasses = employee.classAssignment || [];
        const isAssigned = assignedClasses.some((id) => id.toString() === student.classId?.toString());

        if (!isAssigned) {
          throw new ApiError(403, 'Access denied: You can only generate report cards for students in your assigned classes');
        }
      }

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
