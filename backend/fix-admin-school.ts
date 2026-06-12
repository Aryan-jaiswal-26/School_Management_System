/**
 * One-time fix script: Creates a default school and links it to all
 * SCHOOL_ADMIN / ADMIN users that have no schoolId set.
 *
 * Run with:  npx tsx fix-admin-school.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const MONGODB_URI =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/school_management_erp";

// ── Minimal inline schemas (avoids import path issues when run from root) ────

const SchoolSchema = new mongoose.Schema(
  {
    name: String,
    code: { type: String, unique: true },
    address: String,
    contactEmail: String,
    contactPhone: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    role: String,
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    isActive: { type: Boolean, default: true },
    passwordHash: String,
  },
  { timestamps: true }
);

const School = mongoose.models.School || mongoose.model("School", SchoolSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function run() {
  console.log("Connecting to:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  // 1. Find or create the default school
  let school = await School.findOne({ code: "DEFAULT_SCH" });
  if (!school) {
    school = await School.create({
      name: "Default International School",
      code: "DEFAULT_SCH",
      contactEmail: "contact@school.com",
      isActive: true,
    });
    console.log("✅ Created new school:", school.name, "| ID:", school._id.toString());
  } else {
    console.log("✅ Using existing school:", school.name, "| ID:", school._id.toString());
  }

  // 2. Find all admin users with no schoolId
  const orphanAdmins = await User.find({
    role: { $in: ["SCHOOL_ADMIN", "ADMIN", "admin", "school_admin"] },
    $or: [{ schoolId: { $exists: false } }, { schoolId: null }],
  }).select("_id email role");

  console.log(`\nFound ${orphanAdmins.length} admin user(s) with no schoolId:`);
  orphanAdmins.forEach((u: any) => console.log(" -", u.email, `(${u.role})`));

  if (orphanAdmins.length === 0) {
    console.log("\nAll admin users already have a schoolId. Checking ALL users for diagnosis...");
    const allAdmins = await User.find({
      role: { $in: ["SCHOOL_ADMIN", "ADMIN", "admin", "school_admin"] },
    }).select("_id email role schoolId");
    allAdmins.forEach((u: any) =>
      console.log(" -", u.email, `(${u.role}) schoolId:`, u.schoolId?.toString() || "MISSING")
    );
    await mongoose.disconnect();
    return;
  }

  // 3. Link the school to those admin users
  const ids = orphanAdmins.map((u: any) => u._id);
  const result = await User.updateMany(
    { _id: { $in: ids } },
    { $set: { schoolId: school._id } }
  );

  console.log(`\n✅ Linked school to ${result.modifiedCount} admin user(s).`);
  console.log("\nDone! Please log out and log back in for changes to take effect.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
