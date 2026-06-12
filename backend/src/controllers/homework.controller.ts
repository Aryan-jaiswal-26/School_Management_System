import type { Request, Response, NextFunction } from 'express';
import { HomeworkService } from '../services/homework.service.js';
import { sendResponse } from '../utils/response.js';

export class HomeworkController {
  static async createHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const teacherId = req.user?.id as string;
      const homework = await HomeworkService.createHomework(schoolId, teacherId, req.body);
      sendResponse(res, 201, 'Homework created successfully', homework);
    } catch (error) {
      next(error);
    }
  }

  static async listHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const homework = await HomeworkService.listHomework(schoolId, req.query.classId as string, req.query.subjectId as string);
      sendResponse(res, 200, 'Homework retrieved successfully', homework);
    } catch (error) {
      next(error);
    }
  }

  static async submitHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const studentId = req.user?.id as string;
      const homeworkId = req.params.homeworkId as string;
      const remarks = typeof req.body?.remarks === 'string' ? req.body.remarks : undefined;
      const submission = await HomeworkService.submitHomework(schoolId, studentId, homeworkId, req.file, remarks);
      sendResponse(res, 201, 'Homework submitted successfully', submission);
    } catch (error) {
      next(error);
    }
  }

  static async listSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const homeworkId = req.params.homeworkId as string;
      const submissions = await HomeworkService.listSubmissions(schoolId, homeworkId);
      sendResponse(res, 200, 'Submission tracking retrieved', submissions);
    } catch (error) {
      next(error);
    }
  }

  static async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { homeworkId, submissionId } = req.params;
      const { score, feedback } = req.body;
      const submission = await HomeworkService.gradeSubmission(schoolId, homeworkId as string, submissionId as string, score, feedback);
      sendResponse(res, 200, 'Submission graded successfully', submission);
    } catch (error) {
      next(error);
    }
  }

  static async uploadStudyMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const teacherId = req.user?.id as string;
      const material = await HomeworkService.uploadStudyMaterial(schoolId, teacherId, req.body, req.file);
      sendResponse(res, 201, 'Study material uploaded successfully', material);
    } catch (error) {
      next(error);
    }
  }

  static async listStudyMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const materials = await HomeworkService.listStudyMaterials(schoolId, req.query.classId as string, req.query.subjectId as string);
      sendResponse(res, 200, 'Study materials retrieved successfully', materials);
    } catch (error) {
      next(error);
    }
  }

  static async getSyllabusTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const tracking = await HomeworkService.getSyllabusTracking(schoolId, req.query.classId as string);
      sendResponse(res, 200, 'Syllabus tracking retrieved', tracking);
    } catch (error) {
      next(error);
    }
  }
}
