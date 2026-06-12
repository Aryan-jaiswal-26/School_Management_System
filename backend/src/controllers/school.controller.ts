import type { Request, Response, NextFunction } from 'express';
import { SchoolService } from '../services/school.service.js';
import { sendResponse } from '../utils/response.js';

export class SchoolController {
  // --- Schools ---
  static async createSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await SchoolService.createSchool(req.body);
      sendResponse(res, 201, 'School created successfully', school);
    } catch (error) {
      next(error);
    }
  }

  static async updateSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const school = await SchoolService.updateSchool(id, req.body);
      sendResponse(res, 200, 'School updated successfully', school);
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const school = await SchoolService.getSchoolById(id);
      sendResponse(res, 200, 'School retrieved successfully', school);
    } catch (error) {
      next(error);
    }
  }

  static async listSchools(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, isActive } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const result = await SchoolService.listSchools(
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        isActiveBool
      );
      sendResponse(res, 200, 'Schools retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await SchoolService.deleteSchool(id);
      sendResponse(res, 204, 'School deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Academic Years ---
  static async createAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const ay = await SchoolService.createAcademicYear({ ...req.body, schoolId });
      sendResponse(res, 201, 'Academic year created successfully', ay);
    } catch (error) {
      next(error);
    }
  }

  static async updateAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ay = await SchoolService.updateAcademicYear(id, req.body);
      sendResponse(res, 200, 'Academic year updated successfully', ay);
    } catch (error) {
      next(error);
    }
  }

  static async listAcademicYears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const { page, limit, search, isActive } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const result = await SchoolService.listAcademicYears(
        schoolId,
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        isActiveBool
      );
      sendResponse(res, 200, 'Academic years retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAcademicYear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await SchoolService.deleteAcademicYear(id);
      sendResponse(res, 204, 'Academic year deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Semesters ---
  static async createSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const semester = await SchoolService.createSemester({ ...req.body, schoolId });
      sendResponse(res, 201, 'Semester created successfully', semester);
    } catch (error) {
      next(error);
    }
  }

  static async updateSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const semester = await SchoolService.updateSemester(id, req.body);
      sendResponse(res, 200, 'Semester updated successfully', semester);
    } catch (error) {
      next(error);
    }
  }

  static async listSemesters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const { page, limit, search, isActive, academicYearId } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const result = await SchoolService.listSemesters(
        schoolId,
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        isActiveBool,
        academicYearId as string
      );
      sendResponse(res, 200, 'Semesters retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await SchoolService.deleteSemester(id);
      sendResponse(res, 204, 'Semester deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Branches ---
  static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const branch = await SchoolService.createBranch({ ...req.body, schoolId });
      sendResponse(res, 201, 'Branch created successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const branch = await SchoolService.updateBranch(id, req.body);
      sendResponse(res, 200, 'Branch updated successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  static async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const { page, limit, search, isActive } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const result = await SchoolService.listBranches(
        schoolId,
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        isActiveBool
      );
      sendResponse(res, 200, 'Branches retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await SchoolService.deleteBranch(id);
      sendResponse(res, 204, 'Branch deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async subscribeSchool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const { planCode, durationMonths, amount, paymentMethod, transactionId } = req.body;
      
      const result = await SchoolService.subscribeSchool(
        schoolId,
        planCode || 'free',
        Number(durationMonths) || 1,
        Number(amount) || 0,
        paymentMethod || 'UPI',
        transactionId
      );
      
      sendResponse(res, 200, 'School subscribed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const result = await SchoolService.getSchoolSubscription(schoolId);
      sendResponse(res, 200, 'School subscription retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.params.schoolId as string;
      const result = await SchoolService.getSchoolInvoices(schoolId);
      sendResponse(res, 200, 'School invoices retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
