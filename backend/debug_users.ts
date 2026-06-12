import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/User";
import { Parent } from "./src/models/Parent";
import { Student } from "./src/models/Student";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function debug() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const parentUsers = await User.find({ role: 'PARENT' });
    console.log(`Found ${parentUsers.length} Users with role PARENT:`);
    for (const u of parentUsers) {
        console.log(`- ${u.email}`);
        const p = await Parent.findOne({ userId: u._id });
        if (p) {
            console.log(`  -> Has Parent record: ${p._id}`);
            const students = await Student.find({ parentIds: p._id });
            console.log(`  -> Linked to ${students.length} students`);
        } else {
            console.log(`  -> MISSING Parent record!`);
        }
    }

    const School = require('./src/models/School').School;
    const schools = await School.find({}, 'name code');
    console.log(`Schools: `, schools);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debug();
