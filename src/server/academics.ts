/**
 * Academics Server Actions - TanStack Start
 * Handles grade recording and retrieval with authorization
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError, ValidationError } from "~/lib/db-service";
import { AcademicGradeSchema, BulkGradesInputSchema, type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Record a single grade for a student
 */
export const recordGrade = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    studentId: string;
    studentName: string;
    subject: string;
    grade: string;
    section: string;
    score: number;
    maxScore?: number;
    term: string;
    userRole: AppRole;
  }) => {
    try {
      const validationResult = AcademicGradeSchema.omit({
        id: true,
        created_at: true,
        updated_at: true,
      }).safeParse({
        student_id: ctx.studentId,
        student_name: ctx.studentName,
        subject: ctx.subject,
        grade: ctx.grade,
        section: ctx.section,
        score: ctx.score,
        max_score: ctx.maxScore ?? 100,
        term: ctx.term,
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
      const grade = await db.recordGrade(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: grade,
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

      console.error("[recordGrade] Unexpected error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  },
);

/**
 * Record multiple grades at once (bulk upload)
 */
export const bulkRecordGrades = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    grades: Array<{
      student_id: string;
      student_name: string;
      subject: string;
      grade: string;
      section: string;
      score: number;
      max_score?: number;
      term: string;
    }>;
    userRole: AppRole;
  }) => {
    try {
      const validationResult = BulkGradesInputSchema.safeParse(
        ctx.grades.map((g) => ({
          ...g,
          max_score: g.max_score ?? 100,
        })),
      );

      if (!validationResult.success) {
        return {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
          statusCode: 400,
        };
      }

      const db = getDBService();
      const grades = await db.bulkRecordGrades(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: {
          count: grades.length,
          grades,
        },
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

      console.error("[bulkRecordGrades] Unexpected error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get all grades for a specific student
 */
export const getStudentGrades = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string }) => {
    try {
      const db = getDBService();
      const grades = await db.getStudentGrades(ctx.studentId);

      return {
        success: true,
        data: grades,
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

      console.error("[getStudentGrades] Error:", error);
      return {
        success: false,
        error: "Failed to fetch student grades",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get all grades for a specific term
 */
export const getGradesByTerm = createServerFn({ method: "GET" }).handler(
  async (ctx: { term: string; grade?: string }) => {
    try {
      const db = getDBService();
      const grades = await db.getGradesByTerm(ctx.term, ctx.grade);

      return {
        success: true,
        data: grades,
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

      console.error("[getGradesByTerm] Error:", error);
      return {
        success: false,
        error: "Failed to fetch term grades",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get a student's performance summary for a term
 */
export const getStudentPerformance = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string; term: string }) => {
    try {
      const db = getDBService();
      const grades = await db.getStudentGrades(ctx.studentId);

      const termGrades = grades.filter(
        (g) => g.term === ctx.term && g.student_id === ctx.studentId,
      );

      if (termGrades.length === 0) {
        return {
          success: true,
          data: {
            studentId: ctx.studentId,
            term: ctx.term,
            totalSubjects: 0,
            averageScore: 0,
            grades: [],
          },
          statusCode: 200,
        };
      }

      const totalScore = termGrades.reduce((sum, g) => sum + g.score, 0);
      const averageScore = totalScore / termGrades.length;

      return {
        success: true,
        data: {
          studentId: ctx.studentId,
          term: ctx.term,
          totalSubjects: termGrades.length,
          averageScore: Math.round(averageScore * 100) / 100,
          grades: termGrades,
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

      console.error("[getStudentPerformance] Error:", error);
      return {
        success: false,
        error: "Failed to fetch student performance",
        statusCode: 500,
      };
    }
  },
);
