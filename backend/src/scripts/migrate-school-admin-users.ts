
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.evm") });

const MONGODB_URI =
  process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/school-management";

async function runMigration() {
  try {
    console.log("[MIGRATION] Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("[MIGRATION] Connected successfully.");

    const filter = {
      role: "SUPER_ADMIN",
      schoolId: { $exists: true, $ne: null },
    } as any;

    const candidates = await User.find(filter).select("_id email role schoolId");
    console.log(`[MIGRATION] Found ${candidates.length} school-linked SUPER_ADMIN accounts.`);

    if (candidates.length === 0) {
      console.log("[MIGRATION] Nothing to migrate.");
      process.exit(0);
    }

    const result = await User.updateMany(filter, {
      $set: { role: "SCHOOL_ADMIN" },
    });

    console.log(
      `[MIGRATION] Updated ${result.modifiedCount} user(s) from SUPER_ADMIN to SCHOOL_ADMIN.`,
    );
    console.log("[MIGRATION] Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[MIGRATION] [FATAL ERROR] Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
