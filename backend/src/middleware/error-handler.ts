import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error && typeof (error as any).statusCode === "number") {
    const apiError = error as any;
    console.log(`[ErrorHandler API Error] status=${apiError.statusCode} message="${apiError.message}" path="${_req.originalUrl}" user=${_req.user ? _req.user.email : 'anonymous'}`);
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      details: apiError.details,
    });
  }

  if (typeof Prisma !== "undefined" && Prisma && typeof Prisma.PrismaClientKnownRequestError === "function" && error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with the provided unique field already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Requested record was not found",
      });
    }
  }

  if (error.name === "MongoServerError" && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the provided unique field already exists.",
      details: error.keyValue,
    });
  }

  const payload: Record<string, unknown> = {
    success: false,
    message: "Internal server error",
  };

  if (env.NODE_ENV !== "production") {
    payload.details =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;
  }

  console.error("[Global Error Handler] Caught an unhandled error:", error);
  return res.status(500).json(payload);
};