import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/User";
import { Parent } from "./src/models/Parent";
import { Student } from "./src/models/Student";

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function fixParents() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Find all parents
    const parents = await Parent.find();
    console.log(`Found ${parents.length} parents.`);

    for (const parent of parents) {
      // Find the associated user to get the email
      const user = await User.findById(parent.userId);
      if (!user) continue;

      // If this is the newly registered parent (the user might have used a specific email, let's just link ALL students for demo purposes if they have no students)
      const students = await Student.find({ parentIds: parent._id });
      if (students.length === 0) {
        console.log(`Parent ${user.email} has no students. Linking...`);
        // Link to Aarav and Ananya (or any available students)
        const availableStudents = await Student.find().limit(2);
        for (const s of availableStudents) {
          s.parentIds.push(parent._id);
          await s.save();
          console.log(`Linked student ${s.admissionNumber} to parent ${user.email}`);
        }
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixParents();
