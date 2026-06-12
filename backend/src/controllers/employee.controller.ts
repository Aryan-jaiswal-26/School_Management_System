import type { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service.js';
import { sendResponse } from '../utils/response.js';
import { resolveSchoolId } from '../utils/school.js';

export class EmployeeController {
  static async hireEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const employee = await EmployeeService.hireEmployee(schoolId, req.body);
      sendResponse(res, 201, 'Employee hired successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const employee = await EmployeeService.getEmployeeProfile(schoolId, id);
      sendResponse(res, 200, 'Employee profile retrieved successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  static async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId((req.query.schoolId as string) || req.user?.schoolId)).toString();
      const { page, limit, search, isActive, employeeType, department, branchId } = req.query as any;
      const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.allowedBranchIds;
      const result = await EmployeeService.listEmployees(schoolId, {
         page: Number(page) || 1,
         limit: Number(limit) || 10,
         search: search as string,
         isActive: isActiveBool,
         employeeType: employeeType as string,
         department: department as string,
         branchId: branchId as string,
         allowedBranchIds
      });
      sendResponse(res, 200, 'Employees retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || (req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const employee = await EmployeeService.updateEmployee(schoolId, id, req.body);
      sendResponse(res, 200, 'Employee updated successfully', employee);
    } catch (error) {
      next(error);
    }
  }

  static async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const userId = req.user?.id as string;
      const result = await EmployeeService.markAttendance(schoolId, userId, req.body);
      sendResponse(res, 200, 'Attendance marked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async requestLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const userId = req.user?.id as string;
      const leave = await EmployeeService.requestLeave(schoolId, userId, req.body);
      sendResponse(res, 201, 'Leave requested successfully', leave);
    } catch (error) {
      next(error);
    }
  }

  static async reviewLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || (req.query.schoolId as string) || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const userId = req.user?.id as string;
      const leave = await EmployeeService.reviewLeave(
         schoolId, 
         id, 
         userId, 
         req.body.status, 
         req.body.rejectionReason
      );
      sendResponse(res, 200, 'Leave status updated successfully', leave);
    } catch (error) {
      next(error);
    }
  }

  static async generateSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const salary = await EmployeeService.generateSalary(schoolId, req.body);
      sendResponse(res, 201, 'Salary generated successfully', salary);
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
      const doc = await EmployeeService.uploadDocument(schoolId, id, documentType, req.file);
      sendResponse(res, 201, 'Document uploaded successfully', doc);
    } catch (error) {
      next(error);
    }
  }
}
