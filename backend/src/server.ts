import { createServer } from "node:http";
import mongoose from "mongoose";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/index.js";
import { scheduleJobs } from "./jobs/index.js";
import { Subject } from "./models/Subject.js";

const server = createServer(app);

initializeSocket(server);
scheduleJobs();

// Handle listen errors (e.g., port already in use) and other server errors
server.on('error', async (err: any) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use. Please free the port or configure a different PORT in your environment.`);
  } else {
    console.error('Server error:', err);
  }
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exit(1);
});

export async function startServer(): Promise<void> {
  try {
    await mongoose.connect(env.DATABASE_URL);
    
    // Run database migrations
    await (Subject as any).ensureIndexes();

    server.listen(env.PORT, () => {
      console.log(`School Management ERP API running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exitCode = 1;
  }
}

void startServer();

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  try { await mongoose.disconnect(); } catch {};
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled promise rejection:', reason);
  try { await mongoose.disconnect(); } catch {};
  process.exit(1);
});