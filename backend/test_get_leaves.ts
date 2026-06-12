import mongoose from "mongoose";
import dotenv from "dotenv";
import { HRController } from "./src/controllers/hr.controller";
import { User } from "./src/models/User";
import { Employee } from "./src/models/Employee";
import { LeaveRequest } from "./src/models/LeaveRequest";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function testGetLeaves() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Find a teacher user
    const user = await User.findOne({ role: "TEACHER" });
    if (!user) {
      console.log("No teacher user found in DB to test with.");
      process.exit(1);
    }
    const dbLeaves = await LeaveRequest.find();
    console.log("All DB Leaves details:", dbLeaves.map(l => ({
      id: l._id,
      schoolId: l.schoolId,
      employeeId: l.employeeId,
      leaveType: l.leaveType
    })));

    const req = {
      user: {
        id: user._id.toString(),
        schoolId: user.schoolId.toString(),
        role: user.role,
        email: user.email
      },
      query: {}
    } as any;

    const res = {
      status(code: number) {
        console.log(`Response Status: ${code}`);
        return this;
      },
      json(data: any) {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
        return this;
      }
    } as any;

    const next = (err: any) => {
      if (err) {
        console.error("Next called with error:", err);
      }
    };

    await HRController.getLeaveRequests(req, res, next);
    
    console.log("Test finished.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

testGetLeaves();
