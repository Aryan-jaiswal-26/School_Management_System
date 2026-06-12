import mongoose from "mongoose";
import { env } from "./src/config/env.js";
import { Subject } from "./src/models/Subject.js";

async function cleanupDuplicateSubjects() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.DATABASE_URL);
    console.log("Connected!");

    // Find all Hindi subjects (case-insensitive)
    const hindiSubjects = await Subject.find({
      name: { $regex: "^hindi$", $options: "i" }
    }).select("_id name classId createdAt");

    console.log(`Found ${hindiSubjects.length} Hindi subject(s):`);
    hindiSubjects.forEach((sub, idx) => {
      console.log(`${idx + 1}. ID: ${sub._id}, Class: ${sub.classId}, Name: ${sub.name}, Created: ${sub.createdAt}`);
    });

    if (hindiSubjects.length === 0) {
      console.log("No Hindi subjects found to delete.");
      await mongoose.disconnect();
      return;
    }

    // Delete all Hindi subjects
    const result = await Subject.deleteMany({
      name: { $regex: "^hindi$", $options: "i" }
    });

    console.log(`\n✅ Deleted ${result.deletedCount} subject(s)`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDuplicateSubjects();
