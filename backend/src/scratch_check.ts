import mongoose from 'mongoose';
import { Employee } from './models/Employee.js';
import { Student } from './models/Student.js';
import { StudentService } from './services/student.service.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school_management');
  console.log('Connected to MongoDB');

  // Simulated logged-in user: tanmay patil (teacher)
  // Email: rushiteacher12@gmail.com, User ID: 6a2c2b497766df658a78778b
  const user = {
    id: '6a2c2b497766df658a78778b',
    role: 'TEACHER',
    schoolId: '6a2a39ce0fa120a73da5e6e0'
  };

  const schoolId = user.schoolId;

  const employee = await Employee.findOne({
    userId: user.id,
    isDeleted: { $ne: true }
  });

  if (!employee) {
    console.log('Employee profile not found');
    process.exit(0);
  }

  console.log('Employee Profile:', {
    _id: employee._id,
    name: 'tanmay patil',
    classAssignment: employee.classAssignment,
    sectionAssignment: employee.sectionAssignment
  });

  const assignedClasses = employee.classAssignment || [];
  const assignedSections = employee.sectionAssignment || [];

  let classFilter: any = undefined;
  let sectionFilter: any = undefined;

  // No specific class or section in query (since it's a mount load)
  classFilter = { $in: assignedClasses.map((id) => id.toString()) };
  
  if (assignedSections.length > 0) {
    sectionFilter = { $in: assignedSections.map((id) => id.toString()) };
  }

  console.log('Filters computed by Controller:', {
    classFilter,
    sectionFilter
  });

  const result = await StudentService.listStudents(schoolId, {
    page: 1,
    limit: 100,
    classId: classFilter,
    sectionId: sectionFilter
  });

  console.log('Result count:', result.data.length);
  for (const s of result.data) {
    console.log(`Student name: ${s.user?.firstName} ${s.user?.lastName}, Class: ${s.classDetails?.name}, Section: ${s.sectionDetails?.name}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
