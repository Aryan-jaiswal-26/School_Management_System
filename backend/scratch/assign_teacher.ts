import mongoose from "mongoose";
import dotenv from "dotenv";
import { Employee } from "../src/models/Employee.js";
import { Section } from "../src/models/Section.js";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function assign() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const employee = await Employee.findOne({ employeeType: "TEACHING" });
    if (!employee) {
      console.log("No teaching employee found!");
      process.exit(1);
    }
    console.log(`Found teacher: ${employee._id}`);

    // Update all sections to have this classTeacherId
    const res = await Section.updateMany({}, { $set: { classTeacherId: employee._id } });
    console.log(`Updated ${res.modifiedCount} sections with classTeacherId = ${employee._id}`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

assign();
