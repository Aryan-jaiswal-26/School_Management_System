import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

const UserSchema = new mongoose.Schema({ firstName: String, lastName: String, email: String, role: String, schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" }, isActive: Boolean }, { timestamps: true });
const SchoolSchema = new mongoose.Schema({ name: String, code: String, isActive: Boolean }, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const School = mongoose.models.School || mongoose.model("School", SchoolSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const schools = await School.find({}).select("_id name code");
  console.log("=== SCHOOLS ===");
  schools.forEach((s: any) => console.log(`  [${s._id}] ${s.name} (${s.code})`));

  const users = await User.find({}).select("_id email role schoolId isActive");
  console.log("\n=== ALL USERS ===");
  users.forEach((u: any) => {
    const sid = u.schoolId ? u.schoolId.toString() : "❌ MISSING";
    console.log(`  ${u.email} | role: ${u.role} | schoolId: ${sid} | active: ${u.isActive}`);
  });

  await mongoose.disconnect();
}
run().catch(console.error);
