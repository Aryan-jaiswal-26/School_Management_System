import type { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service.js';
import { sendResponse } from '../utils/response.js';
import { resolveSchoolId } from '../utils/school.js';
import { Employee } from '../models/Employee.js';
import { Section } from '../models/Section.js';
import { Types } from 'mongoose';
import { ApiError } from '../utils/api-error.js';

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
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : (req.user as any)?.allowedBranchIds;

      let classFilter = classId;
      let sectionFilter = sectionId;

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

        // If a specific class is requested, verify if it's assigned
        if (classId) {
          const isAssigned = assignedClasses.some((id) => id.toString() === classId);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this class');
          }
          classFilter = classId;
        } else {
          // If no specific class, limit to all assigned classes
          classFilter = { $in: assignedClasses.map((id) => id.toString()) };
        }

        const targetClassIds = classId ? [new Types.ObjectId(classId)] : assignedClasses;

        // Find assigned sections that belong to the target classes
        const matchingSections = await Section.find({
          _id: { $in: assignedSections },
          classId: { $in: targetClassIds }
        }).select('_id');
        const validSectionIds = matchingSections.map((s) => s._id.toString());

        // If a specific section is requested, verify if it's assigned
        if (sectionId) {
          const isAssigned = assignedSections.some((id) => id.toString() === sectionId);
          if (!isAssigned) {
            throw new ApiError(403, 'Access denied: You are not assigned to this section');
          }
          sectionFilter = sectionId;
        } else if (validSectionIds.length > 0) {
          // Only filter by assigned sections if we actually have some matching the target classes
          sectionFilter = { $in: validSectionIds };
        } else {
          // If the teacher has no assigned sections matching the target classes, do not apply section filter
          sectionFilter = undefined;
        }
      }

      const result = await StudentService.listStudents(schoolId, {
         page: Number(page) || 1,
         limit: Number(limit) || 10,
         search: search as string,
         isActive: isActiveBool,
         classId: classFilter,
         sectionId: sectionFilter,
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
