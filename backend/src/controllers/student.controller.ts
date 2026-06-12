import type { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service.js';
import { sendResponse } from '../utils/response.js';
import { resolveSchoolId } from '../utils/school.js';

export class StudentController {
  static async admitStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Resolve school identifier, allowing schoolCode fallback
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.body.schoolCode || req.user?.schoolId)).toString();

      // Transform legacy payload: if email/password provided at top level, map to studentUser
      if (req.body.email && req.body.password) {
        req.body.studentUser = {
          email: req.body.email,
          password: req.body.password,
          firstName: req.body.firstName || req.body.fullName?.split(' ')[0] || 'First',
          lastName: req.body.lastName || req.body.fullName?.split(' ')[1] || 'Last'
        };
      }

      // Ensure admissionNumber exists; generate if absent
      if (!req.body.admissionNumber) {
        req.body.admissionNumber = `ADM_${Math.floor(100000 + Math.random() * 900000)}`;
      }

      const student = await StudentService.admitStudent(schoolId, req.body);
      sendResponse(res, 201, 'Student admitted successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.getStudentProfile(schoolId, id);
      sendResponse(res, 200, 'Student profile retrieved successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const { page, limit, search, isActive, classId, sectionId, tcStatus, branchId } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.allowedBranchIds;
      const result = await StudentService.listStudents(schoolId, {
         page: Number(page) || 1,
         limit: Number(limit) || 10,
         search: search as string,
         isActive: isActiveBool,
         classId: classId as string,
         sectionId: sectionId as string,
         tcStatus: tcStatus as string,
         branchId: branchId as string,
         allowedBranchIds
      });
      sendResponse(res, 200, 'Students retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || (req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.updateStudent(schoolId, id, req.body);
      sendResponse(res, 200, 'Student updated successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async assignClassAndSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.assignClassAndSection(schoolId, id, req.body.classId, req.body.sectionId);
      sendResponse(res, 200, 'Student class/section updated successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        sendResponse(res, 400, 'No file uploaded');
        return;
      }
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const documentType = req.body.documentType || 'OTHER';
      const doc = await StudentService.uploadDocument(schoolId, id, documentType, req.file);
      sendResponse(res, 201, 'Document uploaded successfully', doc);
    } catch (error) {
      next(error);
    }
  }

  static async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
       const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
       const id = req.params.id as string;
       const docs = await StudentService.listDocuments(schoolId, id);
       sendResponse(res, 200, 'Documents retrieved successfully', docs);
    } catch (error) {
       next(error);
    }
  }

  static async requestTransferCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.updateStudent(schoolId, id, { tcStatus: 'REQUESTED' });
      sendResponse(res, 200, 'Transfer certificate requested successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async issueTransferCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.issueTransferCertificate(schoolId, id, req.body);
      sendResponse(res, 200, 'Transfer certificate issued successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.deleteStudent(schoolId, id);
      sendResponse(res, 200, 'Student deleted successfully', student);
    } catch (error) {
      next(error);
    }
  }

  static async restoreStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const student = await StudentService.restoreStudent(schoolId, id);
      sendResponse(res, 200, 'Student restored successfully', student);
    } catch (error) {
      next(error);
    }
  }
}
