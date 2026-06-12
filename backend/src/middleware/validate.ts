import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error.js";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      console.error('VALIDATION ERROR (body):', JSON.stringify(parsed.error.flatten(), null, 2));
      next(new ApiError(400, 'Request validation failed', parsed.error.flatten()));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateRequest(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      console.error("VALIDATION ERROR:", JSON.stringify(parsed.error.flatten(), null, 2));
      next(new ApiError(400, "Request validation failed", parsed.error.flatten()));
      return;
    }

    if (parsed.data.body !== undefined) {
      req.body = parsed.data.body;
    }
    if (parsed.data.query !== undefined) {
      req.query = parsed.data.query;
    }
    if (parsed.data.params !== undefined) {
      req.params = parsed.data.params;
    }
    next();
  };
}