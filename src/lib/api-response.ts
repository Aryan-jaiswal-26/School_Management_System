/**
 * API Response Utilities
 * Standardized response formatting for all server actions
 */

import type { ApiResponse } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Response Builders
// ═════════════════════════════════════════════════════════════════════════════

export function successResponse<T = unknown>(data: T, statusCode: number = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

export function errorResponse(
  error: string,
  statusCode: number = 500,
  errors?: Record<string, string>,
): ApiResponse {
  return {
    success: false,
    error,
    errors,
    statusCode,
  };
}

export function validationErrorResponse(errors: Record<string, string>): ApiResponse {
  return {
    success: false,
    error: "Validation failed",
    errors,
    statusCode: 400,
  };
}

export function unauthorizedResponse(): ApiResponse {
  return {
    success: false,
    error: "Unauthorized access",
    statusCode: 403,
  };
}

export function notFoundResponse(resource: string): ApiResponse {
  return {
    success: false,
    error: `${resource} not found`,
    statusCode: 404,
  };
}

export function conflictResponse(message: string): ApiResponse {
  return {
    success: false,
    error: message,
    statusCode: 409,
  };
}

export function serverErrorResponse(message?: string): ApiResponse {
  return {
    success: false,
    error: message ?? "An unexpected server error occurred",
    statusCode: 500,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Pagination Helper
// ═════════════════════════════════════════════════════════════════════════════

export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
): {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    data: items.slice(offset, offset + limit),
    pagination: {
      total,
      page,
      limit,
      pages,
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Error Type Guards
// ═════════════════════════════════════════════════════════════════════════════

export function isValidationError(error: unknown): error is Record<string, string[]> {
  return (
    error !== null &&
    typeof error === "object" &&
    !Array.isArray(error) &&
    Object.values(error).every((val) => Array.isArray(val))
  );
}

export function isDBError(error: unknown): error is { message: string; statusCode: number } {
  return error !== null && typeof error === "object" && "message" in error && "statusCode" in error;
}

export function isAuthError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AuthorizationError";
}

// ═════════════════════════════════════════════════════════════════════════════
// Response Type for Client
// ═════════════════════════════════════════════════════════════════════════════

export type ServerResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  statusCode: number;
};

export function isSuccessResponse<T>(
  response: ServerResponse<T>,
): response is ServerResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

export function isErrorResponse(response: ServerResponse): boolean {
  return !response.success;
}
