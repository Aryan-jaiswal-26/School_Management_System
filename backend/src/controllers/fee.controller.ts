import type { Request, Response, NextFunction } from 'express';
import { FeeService } from '../services/fee.service.js';
import { sendResponse } from '../utils/response.js';

export class FeeController {
  static async createFeeStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const structure = await FeeService.createFeeStructure(schoolId, req.body);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'CREATE_FEE_STRUCTURE', 'FEES', structure._id.toString(), { after: structure });
      sendResponse(res, 201, 'Fee structure created successfully', structure);
    } catch (error) {
      next(error);
    }
  }

  static async generateInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const result = await FeeService.generateInvoices(
         schoolId, 
         req.body.classId, 
         req.body.feeStructureId
      );
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'GENERATE_FEE_INVOICES', 'FEES', undefined, { after: req.body });
      sendResponse(res, 201, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async applyConcession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const feeId = req.params.feeId as string;
      const fee = await FeeService.applyConcession(schoolId, feeId, req.body);
      sendResponse(res, 200, 'Concession applied successfully', fee);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentFees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const studentId = req.params.studentId as string;
      const fees = await FeeService.getStudentFees(schoolId, studentId);
      sendResponse(res, 200, 'Student fees retrieved', fees);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const studentId = req.params.studentId as string;
      const payments = await FeeService.getStudentPayments(schoolId, studentId);
      sendResponse(res, 200, 'Student payments retrieved', payments);
    } catch (error) {
      next(error);
    }
  }

  static async getAllFees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { branchId, academicYearId, classId, sectionId, studentId, feeType, status } = req.query as any;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : (req.user as any)?.allowedBranchIds;
      const fees = await FeeService.getAllFees(schoolId, { 
        branchId, 
        allowedBranchIds,
        academicYearId,
        classId,
        sectionId,
        studentId,
        feeType,
        status
      });
      sendResponse(res, 200, 'All fees retrieved', fees);
    } catch (error) {
      next(error);
    }
  }

  static async getAllPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { branchId } = req.query as any;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : (req.user as any)?.allowedBranchIds;
      const payments = await FeeService.getAllPayments(schoolId, { branchId, allowedBranchIds });
      sendResponse(res, 200, 'All payments retrieved', payments);
    } catch (error) {
      next(error);
    }
  }

  static async getFeeStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const structures = await FeeService.getFeeStructures(schoolId);
      sendResponse(res, 200, 'Fee structures retrieved', structures);
    } catch (error) {
      next(error);
    }
  }

  static async getOverdueFees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const overdueFees = await FeeService.getOverdueFees(schoolId);
      sendResponse(res, 200, 'Overdue fees retrieved', overdueFees);
    } catch (error) {
      next(error);
    }
  }

  static async createInstallmentPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const feeId = req.params.feeId as string;
      const plan = await FeeService.createInstallmentPlan(schoolId, feeId, req.body);
      sendResponse(res, 201, 'Installment plan created', plan);
    } catch (error) {
      next(error);
    }
  }

  static async createScholarship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const feeId = req.params.feeId as string;
      const scholarship = await FeeService.createScholarship(schoolId, feeId, req.body);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'CREATE_SCHOLARSHIP', 'FEES', scholarship._id.toString(), { after: scholarship });
      sendResponse(res, 201, 'Scholarship or concession applied', scholarship);
    } catch (error) {
      next(error);
    }
  }

  static async generateReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const paymentId = req.params.paymentId as string;
      const receipt = await FeeService.generateReceipt(schoolId, paymentId);
      sendResponse(res, 200, 'Receipt generated', receipt);
    } catch (error) {
      next(error);
    }
  }

  static async createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const order = await FeeService.createRazorpayOrder(
         schoolId, 
         req.body.feeId, 
         req.body.amount
      );
      sendResponse(res, 201, 'Razorpay order created', order);
    } catch (error) {
      next(error);
    }
  }

  static async verifyRazorpayPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const payment = await FeeService.verifyRazorpayPayment(schoolId, req.body);
      sendResponse(res, 201, 'Payment verified and processed successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  static async recordManualPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const payment = await FeeService.recordManualPayment(schoolId, req.body);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'RECORD_MANUAL_PAYMENT', 'FEES', payment._id.toString(), { after: payment });
      sendResponse(res, 201, 'Manual payment recorded successfully', payment);
    } catch (error) {
      next(error);
    }
  }

  static async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const paymentId = req.params.paymentId as string;
      const result = await FeeService.refundPayment(schoolId, paymentId, req.body);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'REFUND_PAYMENT', 'FEES', paymentId, {
        before: { paymentId, status: 'SUCCESS' },
        after: { paymentId, status: 'REFUNDED', remarks: result.remarks }
      });
      sendResponse(res, 200, 'Payment refunded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async applySiblingDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const result = await FeeService.applySiblingDiscounts(schoolId, { discountPercentage: req.body.discountPercentage });
      sendResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  static async createFeeInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const invoice = await FeeService.createFeeInvoice(schoolId, req.body);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'CREATE_FEE_INVOICE', 'FEES', invoice._id.toString(), { after: invoice });
      sendResponse(res, 201, 'Student fee invoice created successfully', invoice);
    } catch (error) {
      next(error);
    }
  }

  static async sendFeeReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const feeId = req.params.feeId as string;
      const result = await FeeService.sendFeeReminder(schoolId, feeId);
      sendResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  static async sendOverdueReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const result = await FeeService.sendOverdueReminders(schoolId);
      sendResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  static async getScholarshipsForFee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const feeId = req.params.feeId as string;
      const history = await FeeService.getScholarshipsForFee(schoolId, feeId);
      sendResponse(res, 200, 'Concession history retrieved', history);
    } catch (error) {
      next(error);
    }
  }

  static async approveScholarship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const scholarshipId = req.params.scholarshipId as string;
      const approvedByUserId = req.user?.id as string;
      const result = await FeeService.approveScholarship(schoolId, scholarshipId, approvedByUserId);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'APPROVE_SCHOLARSHIP', 'FEES', scholarshipId, { after: result });
      sendResponse(res, 200, 'Concession approved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async rejectScholarship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const scholarshipId = req.params.scholarshipId as string;
      const result = await FeeService.rejectScholarship(schoolId, scholarshipId);
      const logAuditEvent = (await import('../utils/audit.js')).logAuditEvent;
      await logAuditEvent(req, 'REJECT_SCHOLARSHIP', 'FEES', scholarshipId, { after: result });
      sendResponse(res, 200, 'Concession rejected successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async sendUpcomingDueReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const result = await FeeService.sendUpcomingDueReminders(schoolId);
      sendResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  }

  static async getFeeReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const reports = await FeeService.getFeeReports(schoolId);
      sendResponse(res, 200, 'Fee reports generated successfully', reports);
    } catch (error) {
      next(error);
    }
  }
}
