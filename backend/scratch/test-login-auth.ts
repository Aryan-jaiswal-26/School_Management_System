import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;
  const users = await db.collection("users").find({
    email: { $in: ["admin@school.com", "taschool@gmail.com", "tastudent1@gmail.com", "tateacher1@gmail.com"] }
  }).toArray();

  for (const user of users) {
    console.log(`\nUser: ${user.email} | Role: ${user.role}`);
    const passwordsToTest = ["123", "admin123", "password", "password123"];
    let matched = false;
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, user.passwordHash || user.password);
      if (match) {
        console.log(`  -> Match found! Password is: "${pwd}"`);
        matched = true;
        break;
      }
    }
    if (!matched) {
      console.log(`  -> No match found for standard test passwords.`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
