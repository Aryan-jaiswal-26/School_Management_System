import type { Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { sendResponse } from "../utils/response.js";

export async function healthCheck(_req: Request, res: Response): Promise<Response> {
  let databaseStatus: "up" | "degraded" = "up";
  let databaseMessage = "MongoDB connection is healthy";

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.DATABASE_URL);
    }

    await mongoose.connection.db?.admin().ping();
  } catch {
    databaseStatus = "degraded";
    databaseMessage = "MongoDB connection is unavailable";
  }

  return sendResponse(res, 200, "Service health check completed", {
    status: databaseStatus === "up" ? "ok" : "degraded",
    databaseMessage,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    databaseStatus,
    environment: env.NODE_ENV,
  });
}