import type { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service.js';
import { sendResponse } from '../utils/response.js';
import { resolveSchoolId } from '../utils/school.js';
import { logAuditEvent } from '../utils/audit.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { Employee } from '../models/Employee.js';
import { EmployeeAttendance } from '../models/EmployeeAttendance.js';
import { Types } from 'mongoose';

export class EmployeeController {
  static async hireEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const employee = await EmployeeService.hireEmployee(schoolId, req.body);
      sendResponse(res, 201, 'Employee hired successfully', employee);
      await logAuditEvent(req, 'HIRE_EMPLOYEE', 'HR', employee._id);
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
      const allowedBranchIds = (req.user as any)?.role === 'SUPER_ADMIN' ? undefined : (req.user as any)?.allowedBranchIds;
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
      await logAuditEvent(req, 'UPDATE_EMPLOYEE', 'HR', employee._id, { after: req.body });
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
      await logAuditEvent(req, 'MARK_ATTENDANCE', 'HR', undefined, { after: { date: req.body.date, count: req.body.records?.length } });
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
      await logAuditEvent(req, 'REQUEST_LEAVE', 'HR', leave._id, { after: req.body });
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
      await logAuditEvent(req, 'REVIEW_LEAVE', 'HR', leave._id, { after: { status: req.body.status } });
    } catch (error) {
      next(error);
    }
  }

  static async generateSalary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const salary = await EmployeeService.generateSalary(schoolId, req.body);
      sendResponse(res, 201, 'Salary generated successfully', salary);
      await logAuditEvent(req, 'GENERATE_SALARY', 'HR', salary._id, { after: req.body });
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

  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.query.schoolId as string || req.user?.schoolId)).toString();
      const stats = await EmployeeService.getDashboardStats(schoolId);
      sendResponse(res, 200, 'Dashboard statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  static async updateSalaryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.body.schoolId || req.user?.schoolId)).toString();
      const id = req.params.id as string;
      const { status } = req.body;
      
      const validStatuses = ['DRAFT', 'PROCESSED', 'PAID'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status. Must be DRAFT, PROCESSED, or PAID' });
        return;
      }
      
      const salary = await SalaryRecord.findOneAndUpdate(
        { _id: id, schoolId },
        { status },
        { new: true }
      );
      
      if (!salary) {
        res.status(404).json({ success: false, message: 'Salary record not found' });
        return;
      }
      
      sendResponse(res, 200, 'Salary status updated successfully', salary);
      
      await logAuditEvent(req, 'UPDATE_SALARY_STATUS', 'HR', salary._id, { after: { status } });
    } catch (error) {
      next(error);
    }
  }

  static async downloadPayslip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.user?.schoolId)).toString();
      const id = req.params.id as string;
      
      const salary = await SalaryRecord.findOne({ _id: id, schoolId });
      if (!salary) {
        res.status(404).json({ success: false, message: 'Salary record not found' });
        return;
      }
      
      const employee = await Employee.findOne({ _id: salary.employeeId, schoolId, isDeleted: false })
        .populate('userId', '-password');
      if (!employee) {
        res.status(404).json({ success: false, message: 'Employee not found' });
        return;
      }
      
      const PdfPrinter = (await import('pdfmake/build/pdfmake.js' as any)).default ?? (await import('pdfmake/build/pdfmake.js' as any));
      const vfsFonts = (await import('pdfmake/build/vfs_fonts.js' as any)).default ?? (await import('pdfmake/build/vfs_fonts.js' as any));

      if (PdfPrinter.vfs === undefined && vfsFonts?.pdfMake?.vfs) {
        PdfPrinter.vfs = vfsFonts.pdfMake.vfs;
      }

      const fonts = {
        Roboto: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique',
        },
      };

      const schoolName = 'School ERP Campus OS';

      const formatCurrency = (n: number) =>
        `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const employeeObj: any = employee.toObject();
      const userDoc: any = employeeObj.userId;
      
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 50, 40, 50],
        content: [
          { text: schoolName, style: 'schoolHeader', alignment: 'center' },
          { text: 'MONTHLY PAYSLIP', style: 'payslipTitle', alignment: 'center', margin: [0, 5, 0, 15] },
          
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: `Employee ID: ${employee.employeeId}`, style: 'infoText' },
                  { text: `Month/Year: ${salary.month}/${salary.year}`, style: 'infoText', alignment: 'right' }
                ],
                [
                  { text: `Name: ${userDoc?.firstName} ${userDoc?.lastName}`, style: 'infoText' },
                  { text: `Designation: ${employee.designation}`, style: 'infoText', alignment: 'right' }
                ],
                [
                  { text: `Department: ${employee.department || 'N/A'}`, style: 'infoText' },
                  { text: `Status: ${salary.status}`, style: 'infoText', alignment: 'right', bold: true }
                ]
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 20]
          },
          
          { text: 'Salary Details', style: 'sectionHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Description', style: 'tableHeader' },
                  { text: 'Amount', style: 'tableHeader', alignment: 'right' }
                ],
                [
                  { text: 'Basic Pay', style: 'tableCell' },
                  { text: formatCurrency(salary.basicPay), style: 'tableCell', alignment: 'right' }
                ],
                [
                  { text: 'Allowances', style: 'tableCell' },
                  { text: formatCurrency(salary.allowances), style: 'tableCell', alignment: 'right' }
                ],
                [
                  { text: 'Deductions (incl. Attendance Deductions)', style: 'tableCell', color: 'red' },
                  { text: `- ${formatCurrency(salary.deductions)}`, style: 'tableCell', alignment: 'right', color: 'red' }
                ],
                [
                  { text: 'Net Salary', style: 'tableHeader' },
                  { text: formatCurrency(salary.netSalary), style: 'tableHeader', alignment: 'right' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 30]
          },
          
          { text: 'This is a computer-generated payslip and does not require a signature.', style: 'footerText', alignment: 'center' }
        ],
        styles: {
          schoolHeader: { fontSize: 16, bold: true, color: '#1e3a8a' },
          payslipTitle: { fontSize: 12, bold: true, color: '#4b5563' },
          infoText: { fontSize: 10, margin: [0, 2, 0, 2] },
          sectionHeader: { fontSize: 11, bold: true, color: '#1e3a8a', margin: [0, 10, 0, 5] },
          tableHeader: { fontSize: 10, bold: true, fillColor: '#f3f4f6', margin: [0, 4, 0, 4] },
          tableCell: { fontSize: 10, margin: [0, 4, 0, 4] },
          footerText: { fontSize: 8, color: '#9ca3af', italics: true }
        },
        defaultStyle: { font: 'Roboto', fontSize: 10 }
      };

      const pdfDoc = PdfPrinter.createPdf(docDefinition, undefined, fonts, PdfPrinter.vfs);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${employee.employeeId}-${salary.month}-${salary.year}.pdf"`);

      pdfDoc.getBuffer((buffer: Buffer) => {
        res.end(buffer);
      });
      
      await logAuditEvent(req, 'DOWNLOAD_PAYSLIP', 'HR', salary._id);
    } catch (error) {
      next(error);
    }
  }

  static async listSalaries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.query.schoolId as string || req.user?.schoolId)).toString();
      const { month, year } = req.query;
      
      if (!month || !year) {
        res.status(400).json({ success: false, message: 'Month and year are required' });
        return;
      }
      
      const records = await SalaryRecord.find({
        schoolId,
        month: Number(month),
        year: Number(year)
      }).populate({
        path: 'employeeId',
        populate: { path: 'userId', select: '-password' }
      });
      
      sendResponse(res, 200, 'Salary records retrieved successfully', records);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceForDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = (await resolveSchoolId(req.query.schoolId as string || req.user?.schoolId)).toString();
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      const records = await EmployeeAttendance.find({
        schoolId,
        date: { $gte: start, $lte: end }
      });
      
      sendResponse(res, 200, 'Attendance records retrieved successfully', records);
    } catch (error) {
      next(error);
    }
  }
}
