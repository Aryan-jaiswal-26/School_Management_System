import type { Request, Response, NextFunction } from 'express';
import { HomeworkService } from '../services/homework.service.js';
import { sendResponse } from '../utils/response.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/api-error.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';

export class HomeworkController {
  static async createHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const teacherId = req.user?.id as string;

      if (req.user?.role === 'TEACHER') {
        const employee = await Employee.findOne({
          userId: req.user.id,
          schoolId,
          isDeleted: { $ne: true }
        }).select('classAssignment sectionAssignment');

        if (!employee) {
          throw new ApiError(403, 'Teacher profile not found');
        }

        const assignedClasses = employee.classAssignment || [];
        const assignedSections = employee.sectionAssignment || [];

        let targetClassId = req.body.classId;
        let targetSectionId = req.body.sectionId;

        if (!targetClassId && req.body.className && req.body.sectionName) {
          let className = req.body.className;
          if (!className.toLowerCase().startsWith('grade')) {
            className = `Grade ${className}`;
          }
          const classDoc = await Class.findOne({ schoolId, name: className });
          const altClassDoc = classDoc || await Class.findOne({ schoolId, name: req.body.className });
          if (altClassDoc) {
            targetClassId = altClassDoc._id;
            const sectionDoc = await Section.findOne({ schoolId, classId: altClassDoc._id, name: req.body.sectionName });
            if (sectionDoc) {
              targetSectionId = sectionDoc._id;
            }
          }
        }

        if (targetClassId) {
          const isClassAssigned = assignedClasses.some((id) => id.toString() === targetClassId.toString());
          if (!isClassAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        }
        if (targetSectionId && targetClassId) {
          const matchingSections = await Section.find({
            _id: { $in: assignedSections },
            classId: targetClassId
          }).select('_id');
          const validSectionIds = matchingSections.map((s) => s._id.toString());
          if (validSectionIds.length > 0 && !validSectionIds.includes(targetSectionId.toString())) {
            throw new ApiError(403, 'Access denied: You are not assigned to this section');
          }
        }
      }

      const homework = await HomeworkService.createHomework(schoolId, teacherId, req.body);
      sendResponse(res, 201, 'Homework created successfully', homework);
    } catch (error) {
      next(error);
    }
  }

  static async listHomework(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      let classFilter = req.query.classId as string;

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

        if (classFilter) {
          const isAssigned = assignedClasses.some((id) => id.toString() === classFilter);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        } else {
          classFilter = { $in: assignedClasses.map((id) => id.toString()) } as any;
        }
      }

      const homework = await HomeworkService.listHomework(schoolId, classFilter, req.query.subjectId as string);
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

      if (req.user?.role === 'TEACHER') {
        const employee = await Employee.findOne({
          userId: req.user.id,
          schoolId,
          isDeleted: { $ne: true }
        }).select('classAssignment sectionAssignment');

        if (!employee) {
          throw new ApiError(403, 'Teacher profile not found');
        }

        const assignedClasses = employee.classAssignment || [];
        const assignedSections = employee.sectionAssignment || [];

        let targetClassId = req.body.classId;
        let targetSectionId = req.body.sectionId;

        if (!targetClassId && req.body.className && req.body.sectionName) {
          let className = req.body.className;
          if (!className.toLowerCase().startsWith('grade')) {
            className = `Grade ${className}`;
          }
          const classDoc = await Class.findOne({ schoolId, name: className });
          const altClassDoc = classDoc || await Class.findOne({ schoolId, name: req.body.className });
          if (altClassDoc) {
            targetClassId = altClassDoc._id;
            const sectionDoc = await Section.findOne({ schoolId, classId: altClassDoc._id, name: req.body.sectionName });
            if (sectionDoc) {
              targetSectionId = sectionDoc._id;
            }
          }
        }

        if (targetClassId) {
          const isClassAssigned = assignedClasses.some((id) => id.toString() === targetClassId.toString());
          if (!isClassAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        }
        if (targetSectionId && targetClassId) {
          const matchingSections = await Section.find({
            _id: { $in: assignedSections },
            classId: targetClassId
          }).select('_id');
          const validSectionIds = matchingSections.map((s) => s._id.toString());
          if (validSectionIds.length > 0 && !validSectionIds.includes(targetSectionId.toString())) {
            throw new ApiError(403, 'Access denied: You are not assigned to this section');
          }
        }
      }

      const material = await HomeworkService.uploadStudyMaterial(schoolId, teacherId, req.body, req.file);
      sendResponse(res, 201, 'Study material uploaded successfully', material);
    } catch (error) {
      next(error);
    }
  }

  static async listStudyMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      let classFilter = req.query.classId as string;

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

        if (classFilter) {
          const isAssigned = assignedClasses.some((id) => id.toString() === classFilter);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        } else {
          classFilter = { $in: assignedClasses.map((id) => id.toString()) } as any;
        }
      }

      const materials = await HomeworkService.listStudyMaterials(schoolId, classFilter, req.query.subjectId as string);
      sendResponse(res, 200, 'Study materials retrieved successfully', materials);
    } catch (error) {
      next(error);
    }
  }

  static async getSyllabusTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      let classFilter = req.query.classId as string;

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

        if (classFilter) {
          const isAssigned = assignedClasses.some((id) => id.toString() === classFilter);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
        } else {
          classFilter = { $in: assignedClasses.map((id) => id.toString()) } as any;
        }
      }

      const tracking = await HomeworkService.getSyllabusTracking(schoolId, classFilter);
      sendResponse(res, 200, 'Syllabus tracking retrieved', tracking);
    } catch (error) {
      next(error);
    }
  }
}
