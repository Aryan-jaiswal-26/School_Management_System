import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/User.js";
import { Employee } from "../src/models/Employee.js";
import { Section } from "../src/models/Section.js";
import { Class } from "../src/models/Class.js";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const users = await User.find();
    console.log(`Total Users: ${users.length}`);
    console.log("Teacher users:");
    users.filter(u => u.role.toUpperCase() === 'TEACHER').forEach(u => console.log(`- ${u.email} (${u._id})`));

    const employees = await Employee.find().populate("userId");
    console.log(`\nTotal Employees: ${employees.length}`);
    for (const e of employees) {
      console.log(`- ID: ${e.employeeId}, Type: ${e.employeeType}, Name: ${(e.userId as any)?.firstName} ${(e.userId as any)?.lastName}, User ID: ${e.userId?._id}`);
    }

    const classes = await Class.find();
    console.log(`\nTotal Classes: ${classes.length}`);
    for (const c of classes) {
      console.log(`- Class: ${c.name} (${c._id})`);
    }

    const sections = await Section.find();
    console.log(`\nTotal Sections: ${sections.length}`);
    for (const s of sections) {
      console.log(`- Section: ${s.name} (${s._id}) under Class ID: ${s.classId}, ClassTeacherId: ${s.classTeacherId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
