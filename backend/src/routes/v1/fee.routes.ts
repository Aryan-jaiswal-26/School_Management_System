import { Router } from 'express';
import { FeeController } from '../../controllers/fee.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireParentChildAccess } from '../../middleware/resource-isolation.js';
import { requirePermissions } from '../../middleware/rbac.js';
import {
  createFeeStructureSchema,
  generateInvoicesSchema,
  applyConcessionSchema,
  createInstallmentPlanSchema,
  createScholarshipSchema,
  receiptSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  recordManualPaymentSchema,
  createFeeInvoiceSchema
} from '../../validations/fee.validation.js';

export const feeRouter = Router();

// Ensure all routes require authentication
feeRouter.use(authenticateToken);

// --- Fee Structures & Invoices (Admins / Accountants) ---
feeRouter.get(
  '/structures',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  FeeController.getFeeStructures
);

feeRouter.post(
  '/structures',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(createFeeStructureSchema),
  FeeController.createFeeStructure
);

feeRouter.post(
  '/generate',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(generateInvoicesSchema),
  FeeController.generateInvoices
);

feeRouter.patch(
  '/:feeId/concession',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), // Only admins should give scholarships
  requirePermissions('MANAGE_FEES'),
  validateRequest(applyConcessionSchema),
  FeeController.applyConcession
);

// --- Global Fee Queries ---
feeRouter.get(
  '/',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('VIEW_FEES'),
  FeeController.getAllFees
);

feeRouter.get(
  '/payments',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('VIEW_FEES'),
  FeeController.getAllPayments
);

// --- Student Fee Queries ---
feeRouter.get(
  '/student/:studentId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT', 'TEACHER'),
  requireParentChildAccess, // Ensures Parent can only view their own child's fees
  requirePermissions('VIEW_FEES'),
  FeeController.getStudentFees
);

feeRouter.get(
  '/student/:studentId/payments',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT', 'TEACHER'),
  requireParentChildAccess,
  requirePermissions('VIEW_FEES'),
  FeeController.getStudentPayments
);

feeRouter.get(
  '/overdue',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('VIEW_FEES'),
  FeeController.getOverdueFees
);

feeRouter.post(
  '/:feeId/installments',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(createInstallmentPlanSchema),
  FeeController.createInstallmentPlan
);

feeRouter.post(
  '/:feeId/scholarships',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(createScholarshipSchema),
  FeeController.createScholarship
);

feeRouter.get(
  '/receipts/:paymentId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT'),
  requirePermissions('VIEW_FEES'),
  validateRequest(receiptSchema),
  FeeController.generateReceipt
);

// --- Payments (Razorpay Flow) ---
// Note: Parents and Students can initiate and verify payments
feeRouter.post(
  '/razorpay/order',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT', 'STUDENT'),
  requirePermissions('VIEW_FEES'),
  validateRequest(createRazorpayOrderSchema),
  FeeController.createRazorpayOrder
);

feeRouter.post(
  '/razorpay/verify',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT', 'STUDENT'),
  requirePermissions('VIEW_FEES'),
  validateRequest(verifyRazorpayPaymentSchema),
  FeeController.verifyRazorpayPayment
);

// --- Manual Payments (Accountants) ---
feeRouter.post(
  '/manual-payment',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(recordManualPaymentSchema),
  FeeController.recordManualPayment
);

feeRouter.post(
  '/refund/:paymentId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_FEES'),
  FeeController.refundPayment
);

feeRouter.post(
  '/apply-sibling-discounts',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_FEES'),
  FeeController.applySiblingDiscounts
);

// --- Individual Student Fee Invoices & Reminders ---
feeRouter.post(
  '/invoices',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  validateRequest(createFeeInvoiceSchema),
  FeeController.createFeeInvoice
);

feeRouter.post(
  '/:feeId/reminder',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  FeeController.sendFeeReminder
);

feeRouter.post(
  '/reminders/overdue',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  FeeController.sendOverdueReminders
);

feeRouter.get(
  '/reports',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('VIEW_FEES'),
  FeeController.getFeeReports
);

feeRouter.post(
  '/reminders/upcoming',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('MANAGE_FEES'),
  FeeController.sendUpcomingDueReminders
);

feeRouter.get(
  '/:feeId/scholarships',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'),
  requirePermissions('VIEW_FEES'),
  FeeController.getScholarshipsForFee
);

feeRouter.post(
  '/scholarships/:scholarshipId/approve',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_FEES'),
  FeeController.approveScholarship
);

feeRouter.post(
  '/scholarships/:scholarshipId/reject',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermissions('MANAGE_FEES'),
  FeeController.rejectScholarship
);
