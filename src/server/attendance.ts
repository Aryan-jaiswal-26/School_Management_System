/**
 * Attendance Server Actions - TanStack Start
 * Handles all attendance marking and retrieval with proper authorization
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError, ValidationError } from "~/lib/db-service";
import {
  AttendanceRecordSchema,
  BulkAttendanceInputSchema,
  AttendanceFilterSchema,
  type AttendanceRecord,
  type AppRole,
} from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Record a single attendance entry
 */
export const recordAttendance = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    sessionDate: string;
    grade: string;
    section: string;
    studentId: string;
    studentName: string;
    status: string;
    markedByName: string;
    markedById: string;
    userRole: AppRole;
  }) => {
    try {
      // Validate input
      const validationResult = AttendanceRecordSchema.safeParse({
        session_date: ctx.sessionDate,
        grade: ctx.grade,
        section: ctx.section,
        student_id: ctx.studentId,
        student_name: ctx.studentName,
        status: ctx.status,
        marked_by_name: ctx.markedByName,
        marked_by_id: ctx.markedById,
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
      const record = await db.recordAttendance(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: record,
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

      console.error("[recordAttendance] Unexpected error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  },
);

/**
 * Record multiple attendance entries at once (bulk operation)
 */
export const bulkRecordAttendance = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    sessionDate: string;
    grade: string;
    section: string;
    records: Array<{
      student_id: string;
      student_name: string;
      status: string;
    }>;
    markedByName: string;
    markedById: string;
    userRole: AppRole;
  }) => {
    try {
      // Validate bulk input
      const validationResult = BulkAttendanceInputSchema.safeParse(ctx.records);

      if (!validationResult.success) {
        return {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
          statusCode: 400,
        };
      }

      // Add session info to each record
      const fullRecords = ctx.records.map((r) => ({
        session_date: ctx.sessionDate,
        grade: ctx.grade,
        section: ctx.section,
        student_id: r.student_id,
        student_name: r.student_name,
        status: r.status,
      }));

      const db = getDBService();
      const records = await db.bulkRecordAttendance(
        fullRecords,
        ctx.markedByName,
        ctx.markedById,
        ctx.userRole,
      );

      return {
        success: true,
        data: records,
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

      console.error("[bulkRecordAttendance] Unexpected error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get attendance records for a specific date/class
 */
export const getAttendanceForDate = createServerFn({ method: "GET" }).handler(
  async (ctx: { sessionDate: string; grade?: string; section?: string }) => {
    try {
      const validationResult = AttendanceFilterSchema.safeParse({
        session_date: ctx.sessionDate,
        grade: ctx.grade,
        section: ctx.section,
      });

      if (!validationResult.success) {
        return {
          success: false,
          error: "Validation failed",
          statusCode: 400,
        };
      }

      const db = getDBService();
      const records = await db.getAttendanceRecords(ctx.sessionDate, ctx.grade, ctx.section);

      return {
        success: true,
        data: records,
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

      console.error("[getAttendanceForDate] Error:", error);
      return {
        success: false,
        error: "Failed to fetch attendance records",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get attendance history for a specific student
 */
export const getStudentAttendanceHistory = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string; limit?: number }) => {
    try {
      const db = getDBService();
      const records = await db.getStudentAttendance(ctx.studentId, ctx.limit ?? 30);

      return {
        success: true,
        data: records,
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

      console.error("[getStudentAttendanceHistory] Error:", error);
      return {
        success: false,
        error: "Failed to fetch student attendance",
        statusCode: 500,
      };
    }
  },
);
