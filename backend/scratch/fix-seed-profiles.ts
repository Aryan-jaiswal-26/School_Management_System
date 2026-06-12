import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const db = mongoose.connection.db!;

  // 1. Get default school
  const school = await db.collection('schools').findOne({ code: 'DEFAULT_SCH' });
  if (!school) {
    console.error('Default school not found!');
    process.exit(1);
  }
  console.log('Found default school:', school.name, 'ID:', school._id.toString());
  const schoolId = school._id;

  // 2. Get Class "10" and Section "A" (or create them if not found)
  let classDoc = await db.collection('classes').findOne({ schoolId, name: 'Grade 10' });
  if (!classDoc) {
    classDoc = await db.collection('classes').findOne({ schoolId, name: '10' });
  }
  if (!classDoc) {
    const insertRes = await db.collection('classes').insertOne({
      schoolId,
      name: 'Grade 10',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    classDoc = { _id: insertRes.insertedId, name: 'Grade 10' };
    console.log('Created Class: Grade 10');
  } else {
    console.log('Found Class:', classDoc.name, 'ID:', classDoc._id.toString());
  }

  let sectionDoc = await db.collection('sections').findOne({ schoolId, classId: classDoc._id, name: 'A' });
  if (!sectionDoc) {
    const insertRes = await db.collection('sections').insertOne({
      schoolId,
      classId: classDoc._id,
      name: 'A',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    sectionDoc = { _id: insertRes.insertedId, name: 'A' };
    console.log('Created Section: A');
  } else {
    console.log('Found Section:', sectionDoc.name, 'ID:', sectionDoc._id.toString());
  }

  // 3. Fix Student: student@school.com
  const studentUser = await db.collection('users').findOne({ email: 'student@school.com' });
  if (!studentUser) {
    console.error('Student user not found!');
  } else {
    console.log('Found Student user:', studentUser.email, 'ID:', studentUser._id.toString());
    const existingStudent = await db.collection('students').findOne({ userId: studentUser._id });
    if (!existingStudent) {
      const studentInsert = await db.collection('students').insertOne({
        schoolId,
        userId: studentUser._id,
        admissionNumber: 'ADM-2026-9999',
        rollNumber: '10',
        classId: classDoc._id,
        sectionId: sectionDoc._id,
        parentIds: [],
        dob: new Date('2010-01-01'),
        gender: 'MALE',
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Student profile for student@school.com, Student ID:', studentInsert.insertedId.toString());
    } else {
      console.log('Student profile already exists for student@school.com. ID:', existingStudent._id.toString());
      // Update class & section to Grade 10 & Section A to be sure
      await db.collection('students').updateOne(
        { _id: existingStudent._id },
        { $set: { classId: classDoc._id, sectionId: sectionDoc._id, isDeleted: false, isActive: true } }
      );
      console.log('Updated Class/Section for student@school.com');
    }
  }

  // 4. Fix Parent: parent@school.com
  const parentUser = await db.collection('users').findOne({ email: 'parent@school.com' });
  const studentProfile = await db.collection('students').findOne({ userId: studentUser?._id });

  if (parentUser && studentProfile) {
    console.log('Found Parent user:', parentUser.email, 'ID:', parentUser._id.toString());
    let parentProfile = await db.collection('parents').findOne({ userId: parentUser._id });
    if (!parentProfile) {
      const parentInsert = await db.collection('parents').insertOne({
        schoolId,
        userId: parentUser._id,
        contactPrimary: '9999999999',
        address: 'Demo Address',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      parentProfile = { _id: parentInsert.insertedId };
      console.log('Created Parent profile for parent@school.com');
    } else {
      console.log('Parent profile already exists for parent@school.com');
    }

    // Link parent and student
    await db.collection('students').updateOne(
      { _id: studentProfile._id },
      { $addToSet: { parentIds: parentProfile._id } }
    );
    console.log('Linked student@school.com with parent@school.com');
  }

  // 5. Fix Teacher: teacher@school.com
  const teacherUser = await db.collection('users').findOne({ email: 'teacher@school.com' });
  if (teacherUser) {
    console.log('Found Teacher user:', teacherUser.email, 'ID:', teacherUser._id.toString());
    const existingEmployee = await db.collection('employees').findOne({ userId: teacherUser._id });
    if (!existingEmployee) {
      await db.collection('employees').insertOne({
        schoolId,
        userId: teacherUser._id,
        employeeId: 'EMP-TEACHER-1001',
        employeeType: 'TEACHING',
        designation: 'TEACHER',
        joiningDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Created Employee profile for teacher@school.com');
    } else {
      console.log('Employee profile already exists for teacher@school.com');
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
