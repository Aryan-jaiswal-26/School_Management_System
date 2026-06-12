import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { env } from '../config/env.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Fee } from '../models/Fee.js';
import { FeeInstallmentPlan } from '../models/FeeInstallmentPlan.js';
import { FeeScholarship } from '../models/FeeScholarship.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { ApiError } from '../utils/api-error.js';
import { runInTransaction } from '../utils/transaction.js';

export class FeeService {
  static async createFeeStructure(schoolId: string, data: any) {
    if (!data.academicYearId) {
      const currentYear = await mongoose.model('AcademicYear').findOne({ schoolId: new Types.ObjectId(schoolId), isCurrent: true, isActive: true });
      if (currentYear) {
        data.academicYearId = currentYear._id;
      } else {
        let defaultYear = await mongoose.model('AcademicYear').findOne({ schoolId: new Types.ObjectId(schoolId) });
        if (!defaultYear) {
          defaultYear = new (mongoose.model('AcademicYear'))({
            schoolId: new Types.ObjectId(schoolId),
            name: '2026-2027',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2027-05-31'),
            isCurrent: true
          });
          await defaultYear.save();
        }
        data.academicYearId = defaultYear._id;
      }
    }

    const structure = new FeeStructure({
      ...data,
      schoolId: new Types.ObjectId(schoolId),
      classId: new Types.ObjectId(data.classId),
      academicYearId: new Types.ObjectId(data.academicYearId)
    });
    return structure.save();
  }

  static async generateInvoices(schoolId: string, classId: string, feeStructureId: string) {
    const structure = await FeeStructure.findOne({ _id: feeStructureId, schoolId, classId });
    if (!structure) throw new ApiError(404, 'Fee structure not found for this class');

    const students = await Student.find({ schoolId, classId, isActive: true, isDeleted: false });
    if (students.length === 0) throw new ApiError(404, 'No active students found in this class');

    const feesToInsert = students.map(student => ({
      schoolId: new Types.ObjectId(schoolId),
      studentId: student._id,
      feeType: structure.feeType,
      amount: structure.amount,
      dueDate: structure.dueDate,
      description: structure.description
    }));

    let generatedCount = 0;
    for (const fee of feesToInsert) {
       const upserted = await Fee.findOneAndUpdate(
          { schoolId: fee.schoolId, studentId: fee.studentId, feeType: fee.feeType, dueDate: fee.dueDate },
          { $setOnInsert: fee },
          { upsert: true, new: true }
       );
       if (upserted) {
         generatedCount++;
         try {
           this.sendFeeAssignedNotification(schoolId, upserted._id.toString()).catch(e => console.error(e));
         } catch (e) {
           console.error(e);
         }
       }
    }

    return { message: `Invoices generated and parent notifications sent for ${generatedCount} students` };
  }

  static async applyConcession(schoolId: string, feeId: string, data: any) {
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) throw new ApiError(404, 'Fee invoice not found');

    if (fee.paidAmount > 0) {
       throw new ApiError(400, 'Cannot apply concession after payment has started');
    }

    if (data.discountAmount > fee.amount) {
       throw new ApiError(400, 'Discount cannot exceed fee amount');
    }

    fee.discountAmount = data.discountAmount;
    fee.discountReason = data.discountReason;
    
    if (fee.discountAmount === fee.amount) {
       fee.status = 'PAID'; // Full scholarship
    }

    return fee.save();
  }

  static async getStudentFees(schoolId: string, studentId: string) {
    return Fee.find({ schoolId, studentId }).sort({ dueDate: 1 });
  }

  static async getStudentPayments(schoolId: string, studentId: string) {
    return Payment.find({ schoolId, studentId }).sort({ paymentDate: -1 });
  }

  static async getAllFees(schoolId: string, query?: any) {
    const match: any = { schoolId };
    if (query?.branchId) {
      match.branchId = new Types.ObjectId(query.branchId as string);
    } else if (query?.allowedBranchIds && query.allowedBranchIds.length > 0) {
      match.branchId = { $in: query.allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }

    if (query?.feeType && query.feeType !== 'ALL') {
      match.feeType = query.feeType.toUpperCase();
    }
    if (query?.status && query.status !== 'ALL') {
      match.status = query.status.toUpperCase();
    }
    if (query?.studentId && query.studentId !== 'ALL') {
      match.studentId = new Types.ObjectId(query.studentId as string);
    }

    // Resolve student filters (class/section)
    const studentMatch: any = { schoolId };
    let hasStudentFilter = false;

    if (query?.classId && query.classId !== 'ALL') {
      studentMatch.classId = new Types.ObjectId(query.classId as string);
      hasStudentFilter = true;
    }
    if (query?.sectionId && query.sectionId !== 'ALL') {
      studentMatch.sectionId = new Types.ObjectId(query.sectionId as string);
      hasStudentFilter = true;
    }

    if (hasStudentFilter) {
      const students = await Student.find(studentMatch).select('_id');
      match.studentId = { $in: students.map(s => s._id) };
    }

    // Resolve academic year boundaries
    if (query?.academicYearId && query.academicYearId !== 'ALL') {
      const academicYear = await mongoose.model('AcademicYear').findOne({ _id: new Types.ObjectId(query.academicYearId as string), schoolId });
      if (academicYear) {
        match.dueDate = {
          $gte: academicYear.startDate,
          $lte: academicYear.endDate
        };
      }
    }

    return Fee.find(match)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'userId' },
          { 
            path: 'parentIds',
            populate: { path: 'userId' }
          }
        ]
      })
      .sort({ dueDate: 1 });
  }

  static async getAllPayments(schoolId: string, query?: any) {
    const match: any = { schoolId };
    if (query?.branchId) {
      match.branchId = new Types.ObjectId(query.branchId as string);
    } else if (query?.allowedBranchIds && query.allowedBranchIds.length > 0) {
      match.branchId = { $in: query.allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }
    return Payment.find(match).populate('studentId').sort({ paymentDate: -1 }).limit(100);
  }

  static async getFeeStructures(schoolId: string) {
    return FeeStructure.find({ schoolId }).sort({ createdAt: -1 });
  }

  static async getOverdueFees(schoolId: string) {
    const today = new Date();
    return Fee.find({
      schoolId,
      status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      dueDate: { $lt: today },
    }).sort({ dueDate: 1 });
  }

  static async createInstallmentPlan(schoolId: string, feeId: string, data: any) {
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) throw new ApiError(404, 'Fee invoice not found');

    const installmentCount = Number(data.installmentCount || 1);
    const totalAmount = Number(data.totalAmount || fee.amount - fee.discountAmount - fee.paidAmount);
    const amountPerInstallment = Math.round((totalAmount / installmentCount) * 100) / 100;

    const dueDates: Array<{ installmentNumber: number; dueDate: Date; amount: number; status: 'PENDING' | 'PAID'; }> = Array.from({ length: installmentCount }, (_, index) => ({
      installmentNumber: index + 1,
      dueDate: new Date(data.dueDates?.[index]?.dueDate || new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000)),
      amount: amountPerInstallment,
      status: 'PENDING' as const,
    }));

    const plan = await FeeInstallmentPlan.create({
      schoolId,
      feeId,
      studentId: fee.studentId,
      totalAmount,
      installmentCount,
      amountPerInstallment,
      dueDates,
      notes: data.notes,
    });

    fee.status = 'PARTIAL';
    await fee.save();

    return plan;
  }

  static async createScholarship(schoolId: string, feeId: string, data: any) {
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) throw new ApiError(404, 'Fee invoice not found');

    const remaining = fee.amount - fee.discountAmount - fee.paidAmount;
    if (Number(data.amount) > remaining) {
      throw new ApiError(400, 'Scholarship amount cannot exceed outstanding balance');
    }

    // Prevent duplicate concessions/scholarships
    const existing = await FeeScholarship.findOne({
      feeId,
      status: { $in: ['PENDING', 'APPROVED'] }
    });
    if (existing) {
      throw new ApiError(400, 'An active or pending concession is already registered for this fee invoice.');
    }

    const shouldApprove = data.status === 'APPROVED' || !data.status;

    const scholarship = await FeeScholarship.create({
      schoolId: new Types.ObjectId(schoolId),
      feeId: new Types.ObjectId(feeId),
      studentId: fee.studentId,
      type: data.type || 'SCHOLARSHIP',
      amount: Number(data.amount),
      reason: data.reason,
      status: shouldApprove ? 'APPROVED' : 'PENDING',
      approvedBy: shouldApprove && data.approvedBy ? new Types.ObjectId(data.approvedBy as string) : undefined,
      approvedAt: shouldApprove ? new Date() : undefined,
    });

    if (shouldApprove) {
      fee.discountAmount += Number(data.amount);
      fee.status = fee.amount - fee.discountAmount - fee.paidAmount <= 0 ? 'PAID' : 'PARTIAL';
      await fee.save();
    }

    return scholarship;
  }

  static async getScholarshipsForFee(schoolId: string, feeId: string) {
    return FeeScholarship.find({ schoolId, feeId }).populate('approvedBy').sort({ createdAt: -1 });
  }

  static async approveScholarship(schoolId: string, scholarshipId: string, approvedByUserId: string) {
    return runInTransaction(async (session) => {
      const scholarship = await FeeScholarship.findOne({ _id: scholarshipId, schoolId }).session(session || null);
      if (!scholarship) throw new ApiError(404, 'Concession request not found');
      if (scholarship.status !== 'PENDING') throw new ApiError(400, 'Concession is not pending approval');

      const fee = await Fee.findOne({ _id: scholarship.feeId, schoolId }).session(session || null);
      if (!fee) throw new ApiError(404, 'Associated fee not found');

      scholarship.status = 'APPROVED';
      scholarship.approvedBy = new Types.ObjectId(approvedByUserId);
      scholarship.approvedAt = new Date();
      await scholarship.save({ session });

      fee.discountAmount += scholarship.amount;
      fee.status = fee.amount - fee.discountAmount - fee.paidAmount <= 0 ? 'PAID' : 'PARTIAL';
      await fee.save({ session });

      return scholarship;
    });
  }

  static async rejectScholarship(schoolId: string, scholarshipId: string) {
    const scholarship = await FeeScholarship.findOne({ _id: scholarshipId, schoolId });
    if (!scholarship) throw new ApiError(404, 'Concession request not found');
    if (scholarship.status !== 'PENDING') throw new ApiError(400, 'Concession is not pending approval');

    scholarship.status = 'REJECTED';
    return scholarship.save();
  }

  static async generateReceipt(schoolId: string, paymentId: string) {
    const payment = await Payment.findOne({ _id: paymentId, schoolId }).populate('feeId');
    if (!payment) throw new ApiError(404, 'Payment receipt not found');

    const fee = payment.feeId as any;

    return {
      receiptNumber: payment.receiptNumber || `REC-${payment._id.toString().slice(-6)}`,
      paymentId: payment._id,
      studentId: payment.studentId,
      feeType: fee?.feeType || 'FEE',
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      transactionId: payment.transactionId,
      remarks: payment.remarks,
    };
  }

  static async createRazorpayOrder(schoolId: string, feeId: string, amount: number) {
    const fee = await Fee.findOne({ _id: feeId, schoolId });
    if (!fee) throw new ApiError(404, 'Fee invoice not found');

    const remainingAmount = fee.amount - fee.discountAmount - fee.paidAmount;
    if (amount > remainingAmount) {
      throw new ApiError(400, `Amount exceeds remaining balance of ${remainingAmount}`);
    }

    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: `fee_${feeId}_${Date.now()}`,
          notes: { schoolId, feeId },
        }),
      });

      const data = await response.json() as { id?: string; amount?: number; currency?: string };
      if (!response.ok || !data.id) {
        throw new ApiError(502, 'Razorpay order creation failed');
      }

      return {
        orderId: data.id,
        amount: data.amount ? data.amount / 100 : amount,
        currency: data.currency || 'INR',
        key: env.RAZORPAY_KEY_ID,
      };
    }

    const orderId = `order_mock_${Date.now()}`;
    return {
      orderId,
      amount,
      currency: 'INR',
      key: env.RAZORPAY_KEY_ID || null,
    };
  }

  static async processPayment(schoolId: string, feeId: string, data: any, session?: mongoose.ClientSession) {
    const fee = await Fee.findOne({ _id: feeId, schoolId }).session(session || null);
    if (!fee) throw new ApiError(404, 'Fee invoice not found');

    const remainingAmount = fee.amount - fee.discountAmount - fee.paidAmount;
    if (data.amountPaid > remainingAmount) {
      throw new ApiError(400, `Payment amount exceeds remaining balance of ${remainingAmount}`);
    }

    // Prevent duplicate transactions: 5s threshold for identical payments to prevent accidental double clicks
    const recentDuplicate = await Payment.findOne({
      feeId: new Types.ObjectId(feeId),
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      status: 'SUCCESS',
      createdAt: { $gte: new Date(Date.now() - 5000) }
    }).session(session || null);

    if (recentDuplicate) {
      throw new ApiError(400, 'Duplicate payment detected. Please wait a few seconds before retrying.');
    }

    // Generate receipt number
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // GST 18% calculation
    const taxRate = 18;
    const taxAmount = Math.round((data.amountPaid * (taxRate / 118)) * 100) / 100;

    const payment = new Payment({
      schoolId: new Types.ObjectId(schoolId),
      feeId: new Types.ObjectId(feeId),
      studentId: fee.studentId,
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      receiptNumber,
      status: 'SUCCESS',
      taxRate,
      taxAmount,
      fragments: data.fragments,
      remarks: data.remarks
    });

    await payment.save({ session });

    fee.paidAmount += data.amountPaid;
    const newRemaining = fee.amount - fee.discountAmount - fee.paidAmount;
    
    if (newRemaining <= 0) {
      fee.status = 'PAID';
    } else {
      fee.status = 'PARTIAL';
    }

    await fee.save({ session });

    // Send success notification in background
    try {
      this.sendPaymentSuccessNotification(schoolId, payment._id.toString()).catch(err => 
        console.error('Failed to send payment success notification:', err)
      );
    } catch (e) {
      console.error(e);
    }

    return payment;
  }

  static async verifyRazorpayPayment(schoolId: string, data: any) {
    if (env.RAZORPAY_KEY_SECRET) {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== data.razorpaySignature) {
        throw new ApiError(400, 'Invalid Razorpay signature');
      }
    }

    return runInTransaction(async (session) => {
      const paymentData = {
         amountPaid: data.amountPaid,
         paymentMethod: 'ONLINE',
         transactionId: data.razorpayPaymentId,
         remarks: `Razorpay Order: ${data.razorpayOrderId}`
      };

      return this.processPayment(schoolId, data.feeId, paymentData, session);
    });
  }

  static async recordManualPayment(schoolId: string, data: any) {
    return runInTransaction(async (session) => {
      return this.processPayment(schoolId, data.feeId, data, session);
    });
  }

  static async refundPayment(schoolId: string, paymentId: string, data: any) {
    return runInTransaction(async (session) => {
      const payment = await Payment.findOne({ _id: paymentId, schoolId }).session(session || null);
      if (!payment) throw new ApiError(404, 'Payment not found');
      if (payment.status === 'REFUNDED') throw new ApiError(400, 'Payment is already refunded');

      const fee = await Fee.findOne({ _id: payment.feeId, schoolId }).session(session || null);
      if (!fee) throw new ApiError(404, 'Associated fee not found');

      // Reverse the paid amount
      fee.paidAmount -= payment.amountPaid;
      
      const remaining = fee.amount - fee.discountAmount - fee.paidAmount;
      if (remaining >= fee.amount - fee.discountAmount) {
        fee.status = 'PENDING';
      } else if (remaining > 0) {
        fee.status = 'PARTIAL';
      }

      await fee.save({ session });
      
      payment.status = 'REFUNDED';
      payment.remarks = `Refund Reason: ${data?.reason || 'Not specified'}. Approved by: ${data?.approvedBy || 'Admin'}`;
      await payment.save({ session });

      return payment;
    });
  }

  static async applySiblingDiscounts(schoolId: string, data: { discountPercentage: number }) {
    // 1. Group active students by parentId
    const students = await Student.find({ schoolId, isActive: true, isDeleted: false });
    const familyMap = new Map<string, string[]>();

    for (const student of students) {
      if (student.parentIds && student.parentIds.length > 0) {
        const parentId = student.parentIds[0]?.toString();
        if (parentId) {
          if (!familyMap.has(parentId)) familyMap.set(parentId, []);
          familyMap.get(parentId)!.push(student._id.toString());
        }
      }
    }

    let discountsApplied = 0;

    for (const [parentId, siblings] of familyMap.entries()) {
      if (siblings.length > 1) {
        // Apply discount to the second sibling onwards
        for (let i = 1; i < siblings.length; i++) {
          const siblingId = siblings[i];
          
          // Find pending fees for this sibling
          const pendingFees = await Fee.find({ 
            schoolId, 
            studentId: siblingId,
            status: { $in: ['PENDING', 'PARTIAL'] }
          });

          for (const fee of pendingFees) {
            const discountAmount = Math.round((fee.amount * data.discountPercentage) / 100);
            
            // Avoid applying if already discounted
            if (fee.discountAmount === 0 && discountAmount > 0 && discountAmount <= fee.amount - fee.paidAmount) {
              await this.createScholarship(schoolId, fee._id.toString(), {
                type: 'SIBLING_DISCOUNT',
                amount: discountAmount,
                reason: `Sibling discount (${data.discountPercentage}%)`
              });
              discountsApplied++;
            }
          }
        }
      }
    }

    return { message: `Applied ${discountsApplied} sibling discounts successfully` };
  }

  static async createFeeInvoice(schoolId: string, data: any) {
    const student = await Student.findOne({ _id: data.studentId, schoolId, isDeleted: false });
    if (!student) throw new ApiError(404, 'Student not found');

    const fee = new Fee({
      schoolId: new Types.ObjectId(schoolId),
      branchId: student.branchId,
      studentId: student._id,
      feeType: data.feeType.toUpperCase(),
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      description: data.description,
      status: 'PENDING'
    });
    const result = await fee.save();
    try {
      this.sendFeeAssignedNotification(schoolId, result._id.toString()).catch(e => console.error(e));
    } catch (e) {
      console.error(e);
    }
    return result;
  }

  static async sendFeeReminder(schoolId: string, feeId: string) {
    const fee = await Fee.findOne({ _id: feeId, schoolId }).populate({
      path: 'studentId',
      populate: { path: 'userId parentIds' }
    });
    if (!fee) throw new ApiError(404, 'Fee record not found');

    const student = fee.studentId as any;
    const parentUserIds: Types.ObjectId[] = [];

    if (student && student.parentIds) {
      for (const parent of student.parentIds) {
        if (parent.userId) {
          parentUserIds.push(new Types.ObjectId(parent.userId as string));
        }
      }
    }

    if (parentUserIds.length === 0) {
      throw new ApiError(404, 'No parents registered for this student to notify');
    }

    const title = 'Fee Payment Reminder';
    const message = `Dear Parent, this is a friendly reminder that the outstanding fee of ₹${(fee.amount - fee.discountAmount - fee.paidAmount).toLocaleString()} for ${student.userId?.firstName} ${student.userId?.lastName} is due on ${new Date(fee.dueDate).toLocaleDateString()}. Please make the payment soon.`;

    const NotificationService = (await import('./notification.service.js')).NotificationService;
    await NotificationService.enqueue({
      schoolId: schoolId,
      title,
      message,
      type: 'ALERT',
      channels: ['PUSH', 'EMAIL', 'SMS'],
      userIds: parentUserIds.map(id => id.toString()),
      link: '/parent/fees'
    });

    return { message: `Reminders sent to ${parentUserIds.length} parents` };
  }

  static async sendOverdueReminders(schoolId: string) {
    const today = new Date();
    const overdueFees = await Fee.find({
      schoolId,
      status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      dueDate: { $lt: today }
    });

    let sentCount = 0;
    for (const fee of overdueFees) {
      try {
        await this.sendFeeReminder(schoolId, fee._id.toString());
        sentCount++;
      } catch (e) {
        // Continue if parent user is missing
      }
    }

    return { message: `Follow-up reminders sent for ${sentCount} overdue fee invoices.` };
  }

  static async sendFeeAssignedNotification(schoolId: string, feeId: string) {
    const fee = await Fee.findOne({ _id: feeId, schoolId }).populate({
      path: 'studentId',
      populate: { path: 'userId parentIds' }
    });
    if (!fee) return;

    const student = fee.studentId as any;
    const parentUserIds: string[] = [];

    if (student && student.parentIds) {
      for (const parent of student.parentIds) {
        if (parent.userId) {
          parentUserIds.push(parent.userId.toString());
        }
      }
    }

    if (parentUserIds.length === 0) return;

    const title = 'New Fee Invoice Assigned';
    const message = `Dear Parent, a new fee invoice of type ${fee.feeType} for ₹${fee.amount.toLocaleString()} has been assigned for ${student.userId?.firstName || ''} ${student.userId?.lastName || ''}. The due date is ${new Date(fee.dueDate).toLocaleDateString()}. You can pay via the Parent Portal.`;

    const NotificationService = (await import('./notification.service.js')).NotificationService;
    await NotificationService.enqueue({
      schoolId,
      title,
      message,
      type: 'INFO',
      channels: ['PUSH', 'EMAIL', 'SMS'],
      userIds: parentUserIds,
      link: '/parent/fees'
    });
  }

  static async sendPaymentSuccessNotification(schoolId: string, paymentId: string) {
    const payment = await Payment.findOne({ _id: paymentId, schoolId }).populate({
      path: 'studentId',
      populate: { path: 'userId parentIds' }
    }).populate('feeId');
    if (!payment) return;

    const student = payment.studentId as any;
    const fee = payment.feeId as any;
    const parentUserIds: string[] = [];

    if (student && student.parentIds) {
      for (const parent of student.parentIds) {
        if (parent.userId) {
          parentUserIds.push(parent.userId.toString());
        }
      }
    }

    if (parentUserIds.length === 0) return;

    const title = 'Fee Payment Successful';
    const message = `Dear Parent, a payment of ₹${payment.amountPaid.toLocaleString()} towards ${fee?.feeType || 'Fee'} for ${student.userId?.firstName || ''} ${student.userId?.lastName || ''} has been received successfully on ${new Date(payment.paymentDate).toLocaleDateString()}. Receipt Number: ${payment.receiptNumber}. Thank you.`;

    const NotificationService = (await import('./notification.service.js')).NotificationService;
    await NotificationService.enqueue({
      schoolId,
      title,
      message,
      type: 'INFO',
      channels: ['PUSH', 'EMAIL', 'SMS'],
      userIds: parentUserIds,
      link: '/parent/fees'
    });
  }

  static async sendUpcomingDueReminders(schoolId: string) {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingFees = await Fee.find({
      schoolId,
      status: { $in: ['PENDING', 'PARTIAL'] },
      dueDate: { $gte: today, $lte: nextWeek }
    });

    let sentCount = 0;
    for (const fee of upcomingFees) {
      try {
        await this.sendFeeReminder(schoolId, fee._id.toString());
        sentCount++;
      } catch (e) {
        // Skip on error
      }
    }

    return { message: `Upcoming due reminders sent for ${sentCount} fee records.` };
  }

  static async getFeeReports(schoolId: string) {
    // 1. Defaulter List
    const today = new Date();
    const defaulters = await Fee.find({
      schoolId,
      status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      dueDate: { $lt: today }
    }).populate({
      path: 'studentId',
      populate: { path: 'userId' }
    });

    const defaulterReport = defaulters.map(f => {
      const student = f.studentId as any;
      return {
        _id: f._id,
        studentName: `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`,
        admissionNumber: student?.admissionNumber || 'N/A',
        rollNumber: student?.rollNumber || 'N/A',
        classId: student?.classId,
        feeType: f.feeType,
        totalAmount: f.amount,
        paidAmount: f.paidAmount,
        dueAmount: f.amount - f.discountAmount - f.paidAmount,
        dueDate: f.dueDate
      };
    });

    // 2. Monthly Revenue
    const payments = await Payment.find({ schoolId, status: 'SUCCESS' });
    const monthlyMap = new Map<string, number>();
    for (const p of payments) {
      const date = new Date(p.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + p.amountPaid);
    }
    const monthlyRevenueReport = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      amount
    })).sort((a, b) => a.month.localeCompare(b.month));

    // 3. Class-wise Collection
    const classMap = new Map<string, { className: string; collected: number; due: number }>();
    const classes = await mongoose.model('Class').find({ schoolId });
    const classNameMap = new Map<string, string>();
    for (const c of classes) {
      classNameMap.set(c._id.toString(), `${c.name} ${c.section || ''}`);
    }

    const allFees = await Fee.find({ schoolId }).populate({
      path: 'studentId',
      populate: { path: 'userId' }
    });
    for (const f of allFees) {
      const student = f.studentId as any;
      if (!student || !student.classId) continue;
      const classIdStr = student.classId.toString();
      const className = classNameMap.get(classIdStr) || 'Unknown Class';
      
      const current = classMap.get(classIdStr) || { className, collected: 0, due: 0 };
      current.collected += f.paidAmount;
      current.due += (f.amount - f.discountAmount - f.paidAmount);
      classMap.set(classIdStr, current);
    }
    const classWiseReport = Array.from(classMap.entries()).map(([classId, data]) => ({
      classId,
      className: data.className,
      collected: data.collected,
      due: data.due
    }));

    // 4. Student-wise Collection
    const studentWiseReport = allFees.map(f => {
      const student = f.studentId as any;
      return {
        _id: f._id,
        studentName: `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`,
        admissionNumber: student?.admissionNumber || 'N/A',
        rollNumber: student?.rollNumber || 'N/A',
        feeType: f.feeType,
        totalAmount: f.amount,
        paidAmount: f.paidAmount,
        dueAmount: f.amount - f.discountAmount - f.paidAmount,
        status: f.status
      };
    });

    // 5. Discount Report
    const discounts = await FeeScholarship.find({ schoolId, status: 'APPROVED' }).populate({
      path: 'studentId',
      populate: { path: 'userId' }
    });
    const discountReport = discounts.map(d => {
      const student = d.studentId as any;
      return {
        _id: d._id,
        studentName: `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`,
        type: d.type,
        amount: d.amount,
        reason: d.reason,
        approvedAt: d.approvedAt
      };
    });

    // 6. Refund Report
    const refundedPayments = await Payment.find({ schoolId, status: 'REFUNDED' }).populate({
      path: 'studentId',
      populate: { path: 'userId' }
    });
    const refundReport = refundedPayments.map(p => {
      const student = p.studentId as any;
      return {
        _id: p._id,
        studentName: `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`,
        amount: p.amountPaid,
        refundDate: p.updatedAt,
        reason: p.remarks
      };
    });

    return {
      defaulterReport,
      monthlyRevenueReport,
      classWiseReport,
      studentWiseReport,
      discountReport,
      refundReport
    };
  }
}
