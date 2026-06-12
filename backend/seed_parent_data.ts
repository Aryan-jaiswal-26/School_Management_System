import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/User";
import { Parent } from "./src/models/Parent";
import { Student } from "./src/models/Student";
import { School } from "./src/models/School";
import { Class } from "./src/models/Class";
import { Section } from "./src/models/Section";
import bcrypt from "bcrypt";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/school_erp";

async function seedParentData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Fetch the school
    let school = await School.findOne();
    if (!school) {
      school = await School.create({
        name: "Demo School",
        code: "DEMO-123",
        email: "demo@school.com",
        contactNumber: "1234567890",
        address: "Demo City",
        registrationNumber: "REG-1234",
        status: "ACTIVE"
      });
      console.log("Created demo school.");
    }

    // 1. Create a Parent User
    const existingParentUser = await User.findOne({ email: "ramesh@example.com" });
    if (existingParentUser) {
      await User.deleteOne({ _id: existingParentUser._id });
    }

    const hashedPassword = await bcrypt.hash("password123", 10);
    const parentUser = await User.create({
      schoolId: school._id,
      firstName: "Ramesh",
      lastName: "Sharma",
      email: "ramesh@example.com",
      passwordHash: hashedPassword,
      role: "PARENT",
      isActive: true,
      contactNumber: "9876543210",
      createdBy: school._id,
    });

    // 2. Create the Parent record
    const existingParent = await Parent.findOne({ userId: parentUser._id });
    if (existingParent) {
      await Parent.deleteOne({ _id: existingParent._id });
    }

    const parent = await Parent.create({
      schoolId: school._id,
      userId: parentUser._id,
      occupation: "Software Engineer",
      contactPrimary: "9876543210",
      address: "123 Smart City, Pune",
      createdBy: parentUser._id,
    });

    // 3. Create two students (Aarav and Ananya)
    
    // Get existing class/section or create dummy ones if they don't exist
    let grade10 = await Class.findOne({ name: "10" });
    if (!grade10) grade10 = await Class.create({ schoolId: school._id, name: "10", capacity: 40, createdBy: parentUser._id });
    
    let sectionA = await Section.findOne({ name: "A", classId: grade10._id });
    if (!sectionA) sectionA = await Section.create({ schoolId: school._id, classId: grade10._id, name: "A", capacity: 40, roomNumber: "201", createdBy: parentUser._id });

    let grade8 = await Class.findOne({ name: "8" });
    if (!grade8) grade8 = await Class.create({ schoolId: school._id, name: "8", capacity: 40, createdBy: parentUser._id });
    
    let sectionB = await Section.findOne({ name: "B", classId: grade8._id });
    if (!sectionB) sectionB = await Section.create({ schoolId: school._id, classId: grade8._id, name: "B", capacity: 40, roomNumber: "104", createdBy: parentUser._id });

    // Create Aarav
    const aaravUser = await User.create({
      schoolId: school._id,
      firstName: "Aarav",
      lastName: "Sharma",
      email: "aarav@example.com",
      passwordHash: hashedPassword,
      role: "STUDENT",
      isActive: true,
      createdBy: parentUser._id,
    });

    await Student.create({
      schoolId: school._id,
      userId: aaravUser._id,
      admissionNumber: "ADM-1001",
      rollNumber: "1001",
      classId: grade10._id,
      sectionId: sectionA._id,
      parentIds: [parent._id],
      dob: new Date("2008-05-14"),
      gender: "MALE",
      bloodGroup: "O+ Pos",
      createdBy: parentUser._id,
    });

    // Create Ananya
    const ananyaUser = await User.create({
      schoolId: school._id,
      firstName: "Ananya",
      lastName: "Sharma",
      email: "ananya@example.com",
      passwordHash: hashedPassword,
      role: "STUDENT",
      isActive: true,
      createdBy: parentUser._id,
    });

    await Student.create({
      schoolId: school._id,
      userId: ananyaUser._id,
      admissionNumber: "ADM-8024",
      rollNumber: "8024",
      classId: grade8._id,
      sectionId: sectionB._id,
      parentIds: [parent._id],
      dob: new Date("2010-09-22"),
      gender: "FEMALE",
      createdBy: parentUser._id,
    });

    console.log("✅ Successfully seeded Parent and Student data.");
    console.log("Parent Email: ramesh@example.com | Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedParentData();
