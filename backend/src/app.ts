import cors from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestLogger } from "./middleware/logging.js";
import { sendResponse } from "./utils/response.js";
import { resolveTenant } from "./middleware/tenant.js";
import { extractBranchId } from "./middleware/branchAccess.js";
import { setupSwagger } from "./config/swagger.js";

function resolveCorsOrigin(): string | string[] | boolean {
  if (env.CORS_ORIGIN === "*") {
    return true;
  }

  return env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
}

export const app = express();
console.log('ACTIVE NODE_ENV:', process.env.NODE_ENV);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true,
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Ensure local images can be loaded on other ports/origins
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", (req, res, next) => {
  const filename = path.basename(req.path);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  next();
}, express.static(path.join(process.cwd(), "uploads")));

app.use(resolveTenant);
app.use(extractBranchId);
app.use(requestLogger);

setupSwagger(app);

app.get("/", (_req, res) => {
  sendResponse(res, 200, "School Management ERP API", {
    status: "ok",
    apiVersion: "v1",
    healthCheck: "/healthz",
    documentation: "/api/v1",
  });
});

app.get("/healthz", (_req, res) => {
  sendResponse(res, 200, "Service is running", {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);