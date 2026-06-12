/**
 * Library Management Server Actions - TanStack Start
 * Handles book inventory, circulation, and checkout management
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError } from "~/lib/db-service";
import { type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all library books
 */
export const getLibraryBooks = createServerFn({ method: "GET" }).handler(
  async (ctx: { category?: string }) => {
    try {
      const db = getDBService();
      const books = await db.getLibraryBooks(ctx.category);

      return {
        success: true,
        data: books,
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

      console.error("[getLibraryBooks] Error:", error);
      return {
        success: false,
        error: "Failed to fetch library books",
        statusCode: 500,
      };
    }
  },
);

/**
 * Issue a book to a student
 */
export const issueBook = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    bookId: string;
    studentId: string;
    studentName: string;
    dueDays?: number;
    userRole: AppRole;
  }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can issue books",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const circulation = await db.issueBook(
        ctx.bookId,
        ctx.studentId,
        ctx.studentName,
        ctx.dueDays ?? 14,
        ctx.userRole,
      );

      return {
        success: true,
        data: circulation,
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

      console.error("[issueBook] Error:", error);
      return {
        success: false,
        error: "Failed to issue book",
        statusCode: 500,
      };
    }
  },
);

/**
 * Return a book
 */
export const returnBook = createServerFn({ method: "POST" }).handler(
  async (ctx: { circulationId: string; userRole: AppRole }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can process returns",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const circulation = await db.returnBook(ctx.circulationId, ctx.userRole);

      return {
        success: true,
        data: circulation,
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

      console.error("[returnBook] Error:", error);
      return {
        success: false,
        error: "Failed to return book",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get student's checked out books
 */
export const getStudentBooks = createServerFn({ method: "GET" }).handler(
  async (ctx: { studentId: string }) => {
    try {
      const db = getDBService();
      const circulations = await db.getStudentCirculations(ctx.studentId);

      // Separate issued and returned
      const issuedBooks = circulations.filter((c) => c.status === "issued");
      const returnedBooks = circulations.filter((c) => c.status === "returned");
      const overdueBooks = circulations.filter((c) => {
        if (c.status !== "issued") return false;

        const dueDate = new Date(c.due_date);
        return dueDate < new Date();
      });

      return {
        success: true,
        data: {
          studentId: ctx.studentId,
          issuedCount: issuedBooks.length,
          returnedCount: returnedBooks.length,
          overdueCount: overdueBooks.length,
          issued: issuedBooks,
          returned: returnedBooks,
          overdue: overdueBooks,
          all: circulations,
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

      console.error("[getStudentBooks] Error:", error);
      return {
        success: false,
        error: "Failed to fetch student books",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get library statistics
 */
export const getLibraryStats = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      const db = getDBService();
      const books = await db.getLibraryBooks();

      const totalCopies = books.reduce((sum, b) => sum + b.total_copies, 0);
      const availableCopies = books.reduce((sum, b) => sum + b.available_copies, 0);
      const issuedCopies = totalCopies - availableCopies;

      const categories = [...new Set(books.map((b) => b.category))];
      const categoryStats = categories.map((cat) => {
        const catBooks = books.filter((b) => b.category === cat);
        return {
          category: cat,
          totalBooks: catBooks.length,
          totalCopies: catBooks.reduce((sum, b) => sum + b.total_copies, 0),
          availableCopies: catBooks.reduce((sum, b) => sum + b.available_copies, 0),
          issuedCopies: catBooks.reduce((sum, b) => sum + (b.total_copies - b.available_copies), 0),
        };
      });

      return {
        success: true,
        data: {
          totalTitles: books.length,
          totalCopies,
          availableCopies,
          issuedCopies,
          circulationPercentage: Math.round((issuedCopies / totalCopies) * 100),
          categoryStats,
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

      console.error("[getLibraryStats] Error:", error);
      return {
        success: false,
        error: "Failed to fetch library statistics",
        statusCode: 500,
      };
    }
  },
);

/**
 * Search library books
 */
export const searchBooks = createServerFn({ method: "GET" }).handler(
  async (ctx: { query: string; category?: string }) => {
    try {
      const db = getDBService();
      const books = await db.getLibraryBooks(ctx.category);

      const queryLower = ctx.query.toLowerCase();
      const filtered = books.filter(
        (b) =>
          b.title.toLowerCase().includes(queryLower) ||
          b.author.toLowerCase().includes(queryLower) ||
          (b.isbn?.includes(ctx.query) ?? false),
      );

      return {
        success: true,
        data: {
          query: ctx.query,
          resultsCount: filtered.length,
          books: filtered,
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

      console.error("[searchBooks] Error:", error);
      return {
        success: false,
        error: "Failed to search books",
        statusCode: 500,
      };
    }
  },
);
