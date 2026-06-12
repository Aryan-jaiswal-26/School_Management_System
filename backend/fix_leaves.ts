import mongoose from "mongoose";
import dotenv from "dotenv";
import { LeaveRequest } from "./src/models/LeaveRequest";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function fixLeaves() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const leaves = await LeaveRequest.find();
    console.log(`Found ${leaves.length} leave requests in DB.`);

    for (const leave of leaves) {
      console.log(`Leave Request ID: ${leave._id}`);
      console.log(`  leaveType: ${leave.leaveType}`);
      console.log(`  startDate: ${leave.startDate} (${typeof leave.startDate})`);
      console.log(`  endDate: ${leave.endDate} (${typeof leave.endDate})`);
      console.log(`  reason: ${leave.reason}`);
      console.log(`  status: ${leave.status}`);

      // Check if dates are invalid
      const startInvalid = isNaN(leave.startDate?.getTime());
      const endInvalid = isNaN(leave.endDate?.getTime());

      if (startInvalid || endInvalid) {
        console.log(`  -> Deleting leave request due to invalid dates.`);
        await LeaveRequest.deleteOne({ _id: leave._id });
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixLeaves();
