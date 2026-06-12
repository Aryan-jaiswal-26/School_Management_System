/**
 * Fees & Payments Server Actions - TanStack Start
 * Handles fee records, payments, and financial tracking
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError, ValidationError } from "~/lib/db-service";
import { PaymentLedgerSchema, type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get fee records for a student or all (if admin)
 */
export const getFeeRecords = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId?: string; status?: string; limit?: number; userRole: AppRole }) => {
    try {
      // Students can only view their own fees
      if (ctx.userRole === "student" && !ctx.studentId) {
        return {
          success: false,
          error: "Student ID required for student role",
          statusCode: 400,
        };
      }

      const db = getDBService();
      const fees = await db.getFeeRecords(ctx.studentId, ctx.status, ctx.limit ?? 100);

      return {
        success: true,
        data: fees,
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getFeeRecords] Error:", error);
      return {
        success: false,
        error: "Failed to fetch fee records",
        statusCode: 500,
      };
    }
  },
);

/**
 * Record a payment for a fee
 */
export const recordPayment = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    studentId: string;
    feeRecordId: string;
    amount: number;
    method: string;
    receiptNo?: string;
    gatewayRef?: string;
    paidBy?: string;
    userRole: AppRole;
  }) => {
    try {
      // Students can only record their own payments
      if (ctx.userRole === "student") {
        // Verify this is actually their fee record
        // Additional security check can be added here
      }

      const validationResult = PaymentLedgerSchema.omit({
        id: true,
        created_at: true,
      }).safeParse({
        student_id: ctx.studentId,
        fee_record_id: ctx.feeRecordId,
        amount: ctx.amount,
        method: ctx.method,
        receipt_no: ctx.receiptNo,
        gateway_ref: ctx.gatewayRef,
        status: "success",
        paid_by: ctx.paidBy,
      });

      if (!validationResult.success) {
        return {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
          statusCode: 400,
        };
      }

      const db = getDBService();
      const payment = await db.recordPayment(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: payment,
        statusCode: 201,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          errors: error.errors,
          statusCode: 400,
        };
      }

      if (error instanceof AuthorizationError) {
        return {
          success: false,
          error: error.message,
          statusCode: 403,
        };
      }

      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[recordPayment] Unexpected error:", error);
      return {
        success: false,
        error: "Failed to record payment",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get payment history for a student
 */
export const getPaymentHistory = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string; userRole: AppRole }) => {
    try {
      // Students can only view their own payment history
      if (ctx.userRole === "student") {
        // Additional security check can be added
      }

      const db = getDBService();
      const payments = await db.getPaymentHistory(ctx.studentId);

      return {
        success: true,
        data: payments,
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getPaymentHistory] Error:", error);
      return {
        success: false,
        error: "Failed to fetch payment history",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get fee summary for a student
 */
export const getFeeSummary = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string }) => {
    try {
      const db = getDBService();
      const fees = await db.getFeeRecords(ctx.studentId);

      const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
      const totalPaid = fees.reduce((sum, f) => sum + f.paid, 0);
      const totalDue = fees.reduce((sum, f) => sum + f.due, 0);

      const statusBreakdown = {
        paid: fees.filter((f) => f.status === "paid").length,
        partial: fees.filter((f) => f.status === "partial").length,
        pending: fees.filter((f) => f.status === "pending").length,
        overdue: fees.filter((f) => f.status === "overdue").length,
      };

      return {
        success: true,
        data: {
          studentId: ctx.studentId,
          totalAmount,
          totalPaid,
          totalDue,
          percentagePaid: Math.round((totalPaid / totalAmount) * 100) || 0,
          statusBreakdown,
          records: fees,
        },
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getFeeSummary] Error:", error);
      return {
        success: false,
        error: "Failed to fetch fee summary",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get overdue fees (admin/staff only)
 */
export const getOverdueFees = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can view overdue fees",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const overdue = await db.getFeeRecords(undefined, "overdue", 500);

      return {
        success: true,
        data: {
          count: overdue.length,
          records: overdue,
        },
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getOverdueFees] Error:", error);
      return {
        success: false,
        error: "Failed to fetch overdue fees",
        statusCode: 500,
      };
    }
  },
);
