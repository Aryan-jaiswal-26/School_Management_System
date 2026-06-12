import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { School } from './src/models/School.js';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';
import { Student } from './src/models/Student.js';
import { Timetable } from './src/models/Timetable.js';
import { Result } from './src/models/Result.js';
import { Homework } from './src/models/Homework.js';
import { HomeworkSubmission } from './src/models/HomeworkSubmission.js';
import { Class } from './src/models/Class.js';
import { Section } from './src/models/Section.js';
import { Subject } from './src/models/Subject.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp');
  console.log('Connected to DB');

  let teacherUser = await User.findOne({ role: 'teacher' });
  if (!teacherUser) teacherUser = await User.findOne({ role: 'TEACHER' });
  
  if (!teacherUser) {
    const school = await School.findOne();
    if (!school) {
      console.log('No school found either');
      process.exit(1);
    }
    teacherUser = await User.create({
      firstName: 'Teacher',
      lastName: 'One',
      email: 'teacher@school.com',
      passwordHash: 'dummy',
      role: 'teacher',
      schoolId: school._id,
      isActive: true
    });
    console.log('Created teacher user');
  }
  
  const sId = teacherUser.schoolId;
  let teacher = await Employee.findOne({ userId: teacherUser._id });
  if (!teacher) {
    teacher = await Employee.create({
      schoolId: sId,
      userId: teacherUser._id,
      employeeId: 'EMP_DEMO',
      employeeType: 'TEACHING',
      isActive: true,
      joiningDate: new Date(),
    });
  }
  
  console.log('Seeding data for school:', sId, 'Teacher:', teacherUser.email);
  
  // Create 4 classes
  const classesData = ['9', '10', '11', '12'];
  const sectionsData = ['A'];
  
  const subjects = ['Mathematics', 'Science', 'English', 'History'];
  let subDocs = [];
  for (const sub of subjects) {
    let s = await Subject.findOne({ schoolId: sId, name: sub });
    if (!s) s = await Subject.create({ schoolId: sId, name: sub, code: sub.substring(0,3).toUpperCase() });
    subDocs.push(s);
  }
  
  for (let i = 0; i < classesData.length; i++) {
    const className = classesData[i];
    let classDoc = await Class.findOne({ schoolId: sId, name: className });
    if (!classDoc) classDoc = await Class.create({ schoolId: sId, name: className });
    
    let secDoc = await Section.findOne({ schoolId: sId, classId: classDoc._id, name: 'A' });
    if (!secDoc) secDoc = await Section.create({ schoolId: sId, classId: classDoc._id, name: 'A' });
    
    // Create 5 students for this class
    const studentUsers = [];
    for (let j = 0; j < 5; j++) {
      const email = `student${j}_c${className}_${Math.random().toString(36).substring(7)}@school.com`;
      const su = await User.create({
        schoolId: sId,
        firstName: `Student${j}`,
        lastName: `Class${className}`,
        email,
        passwordHash: 'dummy',
        role: 'STUDENT',
      });
      studentUsers.push(su);
      await Student.create({
        schoolId: sId,
        userId: su._id,
        admissionNumber: `ADM_${className}_${j}_${Math.random().toString(36).substring(7)}`,
        classId: classDoc._id,
        sectionId: secDoc._id,
        dob: new Date(),
        gender: 'MALE',
        isActive: true,
      });
    }
    
    // Add timetable for this teacher
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const day of days) {
      await Timetable.create({
        schoolId: sId,
        classId: classDoc._id,
        sectionId: secDoc._id,
        subjectId: subDocs[0]._id, // Maths
        teacherId: teacher._id,
        dayOfWeek: day,
        startTime: `0${9+i}:00`,
        endTime: `0${9+i}:45`,
        room: `Room ${101+i}`,
        isActive: true
      });
    }
    
    // Add results for these students
    const students = await Student.find({ classId: classDoc._id });
    for (const st of students) {
      await Result.create({
        schoolId: sId,
        studentId: st._id,
        subjectId: subDocs[0]._id,
        examId: new mongoose.Types.ObjectId(), // dummy
        marksObtained: Math.floor(Math.random() * 40) + 60, // 60 to 100
        maxMarks: 100,
        grade: 'A',
      });
    }
    
    // Add some homework and submissions
    const hw = await Homework.create({
      schoolId: sId,
      title: `Maths Assignment ${className}`,
      description: 'Solve exercises',
      classId: classDoc._id,
      sectionId: secDoc._id,
      subjectId: subDocs[0]._id,
      teacherId: teacher._id,
      dueDate: new Date(Date.now() - 86400000 * (i * 2)), // past days
    });
    
    let subCount = 0;
    for (const st of students) {
      if (subCount++ < 3) {
        await HomeworkSubmission.create({
          schoolId: sId,
          homeworkId: hw._id,
          studentId: st._id,
          status: Math.random() > 0.3 ? 'SUBMITTED' : 'LATE',
          submittedAt: new Date(),
        });
      }
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

main().catch(console.error);
