/**
 * HR & Leave Management Server Actions - TanStack Start
 * Handles leave requests, approvals, and staff management
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError } from "~/lib/db-service";
import { LeaveRequestSchema, type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Create a leave request
 */
export const createLeaveRequest = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    staffId: string;
    staffName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    userRole: AppRole;
  }) => {
    try {
      // Only staff can request leave
      if (!["teacher", "admin"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can request leave",
          statusCode: 403,
        };
      }

      // Validate dates
      const start = new Date(ctx.startDate);
      const end = new Date(ctx.endDate);

      if (start > end) {
        return {
          success: false,
          error: "Start date must be before or equal to end date",
          statusCode: 400,
        };
      }

      if (start < new Date()) {
        return {
          success: false,
          error: "Leave start date cannot be in the past",
          statusCode: 400,
        };
      }

      const validationResult = LeaveRequestSchema.omit({
        id: true,
        created_at: true,
        updated_at: true,
      }).safeParse({
        staff_id: ctx.staffId,
        staff_name: ctx.staffName,
        leave_type: ctx.leaveType,
        start_date: ctx.startDate,
        end_date: ctx.endDate,
        reason: ctx.reason,
        status: "pending",
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
      const leaveRequest = await db.createLeaveRequest(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: leaveRequest,
        statusCode: 201,
      };
    } catch (error) {
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

      console.error("[createLeaveRequest] Error:", error);
      return {
        success: false,
        error: "Failed to create leave request",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get leave requests with optional filtering
 */
export const getLeaveRequests = createServerFn({ method: "GET" }).handler(
  async (ctx: { staffId?: string; status?: string; userRole: AppRole }) => {
    try {
      const db = getDBService();
      const requests = await db.getLeaveRequests(ctx.staffId, ctx.status, ctx.userRole);

      return {
        success: true,
        data: requests,
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

      console.error("[getLeaveRequests] Error:", error);
      return {
        success: false,
        error: "Failed to fetch leave requests",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get pending leave requests (admin view)
 */
export const getPendingLeaveRequests = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      if (ctx.userRole !== "admin") {
        return {
          success: false,
          error: "Unauthorized: only admins can view pending requests",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const requests = await db.getLeaveRequests(undefined, "pending", ctx.userRole);

      return {
        success: true,
        data: {
          count: requests.length,
          requests,
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

      console.error("[getPendingLeaveRequests] Error:", error);
      return {
        success: false,
        error: "Failed to fetch pending requests",
        statusCode: 500,
      };
    }
  },
);

/**
 * Approve a leave request
 */
export const approveLeaveRequest = createServerFn({ method: "POST" }).handler(
  async (ctx: { requestId: string; approvedBy: string; userRole: AppRole }) => {
    try {
      if (ctx.userRole !== "admin") {
        return {
          success: false,
          error: "Unauthorized: only admins can approve leave",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const leaveRequest = await db.approveLeaveRequest(
        ctx.requestId,
        ctx.approvedBy,
        ctx.userRole,
      );

      return {
        success: true,
        data: leaveRequest,
        statusCode: 200,
      };
    } catch (error) {
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

      console.error("[approveLeaveRequest] Error:", error);
      return {
        success: false,
        error: "Failed to approve leave request",
        statusCode: 500,
      };
    }
  },
);

/**
 * Reject a leave request
 */
export const rejectLeaveRequest = createServerFn({ method: "POST" }).handler(
  async (ctx: { requestId: string; reason?: string; userRole: AppRole }) => {
    try {
      if (ctx.userRole !== "admin") {
        return {
          success: false,
          error: "Unauthorized: only admins can reject leave",
          statusCode: 403,
        };
      }

      // Note: This would need a rejectLeaveRequest method in DatabaseService
      // For now, we'll use a workaround by updating status directly
      // In a production system, you'd add this method to the DB service

      return {
        success: false,
        error: "Not implemented: add rejectLeaveRequest to DatabaseService",
        statusCode: 501,
      };
    } catch (error) {
      console.error("[rejectLeaveRequest] Error:", error);
      return {
        success: false,
        error: "Failed to reject leave request",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get staff member's leave statistics
 */
export const getLeaveStatistics = createServerFn({ method: "GET" }).handler(
  async (ctx: { staffId: string; year?: number }) => {
    try {
      const currentYear = ctx.year ?? new Date().getFullYear();
      const db = getDBService();
      const requests = await db.getLeaveRequests(ctx.staffId);

      const yearRequests = requests.filter((r) => {
        const startYear = new Date(r.start_date).getFullYear();
        return startYear === currentYear;
      });

      // Calculate leave days by type
      const leaveByType: Record<string, { count: number; days: number }> = {};

      yearRequests.forEach((req) => {
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (!leaveByType[req.leave_type]) {
          leaveByType[req.leave_type] = { count: 0, days: 0 };
        }

        leaveByType[req.leave_type].count += 1;
        leaveByType[req.leave_type].days += days;
      });

      const totalDays = Object.values(leaveByType).reduce((sum, item) => sum + item.days, 0);

      return {
        success: true,
        data: {
          staffId: ctx.staffId,
          year: currentYear,
          totalRequests: yearRequests.length,
          totalDays,
          approved: yearRequests.filter((r) => r.status === "approved").length,
          pending: yearRequests.filter((r) => r.status === "pending").length,
          rejected: yearRequests.filter((r) => r.status === "rejected").length,
          leaveByType,
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

      console.error("[getLeaveStatistics] Error:", error);
      return {
        success: false,
        error: "Failed to fetch leave statistics",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get HR dashboard statistics
 */
export const getHRDashboard = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can view HR dashboard",
          statusCode: 403,
        };
      }

      const db = getDBService();

      // Get all staff
      const allStaff = await db.getAllProfiles("teacher");
      const allAdmins = await db.getAllProfiles("admin");

      // Get pending leaves
      const pendingLeaves = await db.getLeaveRequests(undefined, "pending", ctx.userRole);
      const approvedLeaves = await db.getLeaveRequests(undefined, "approved", ctx.userRole);

      return {
        success: true,
        data: {
          totalTeachers: allStaff.length,
          totalAdmins: allAdmins.length,
          totalStaff: allStaff.length + allAdmins.length,
          pendingLeaveRequests: pendingLeaves.length,
          approvedLeaveThisMonth: approvedLeaves.filter((r) => {
            const startDate = new Date(r.start_date);
            const now = new Date();
            return (
              startDate.getMonth() === now.getMonth() &&
              startDate.getFullYear() === now.getFullYear()
            );
          }).length,
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

      console.error("[getHRDashboard] Error:", error);
      return {
        success: false,
        error: "Failed to fetch HR dashboard",
        statusCode: 500,
      };
    }
  },
);
