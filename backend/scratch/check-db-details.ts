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

  // 1. Classes
  const classes = await db.collection('classes').find({}).toArray();
  console.log(`\n=== Classes (${classes.length}) ===`);
  for (const c of classes) {
    console.log(`- ID: ${c._id.toString()}, Name: ${c.name}`);
  }

  // 2. Sections
  const sections = await db.collection('sections').find({}).toArray();
  console.log(`\n=== Sections (${sections.length}) ===`);
  for (const s of sections) {
    console.log(`- ID: ${s._id.toString()}, ClassID: ${s.classId.toString()}, Name: ${s.name}`);
  }

  // 3. Subjects
  const subjects = await db.collection('subjects').find({}).toArray();
  console.log(`\n=== Subjects (${subjects.length}) ===`);
  for (const sub of subjects) {
    console.log(`- ID: ${sub._id.toString()}, Name: ${sub.name}, Code: ${sub.code}`);
  }

  // 4. Users
  const users = await db.collection('users').find({}).toArray();
  console.log(`\n=== Users (${users.length}) ===`);
  for (const u of users) {
    console.log(`- ID: ${u._id.toString()}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}, Role: ${u.role}`);
  }

  // 5. Students
  const students = await db.collection('students').find({}).toArray();
  console.log(`\n=== Students (${students.length}) ===`);
  for (const s of students) {
    console.log(`- ID: ${s._id.toString()}, UserID: ${s.userId?.toString()}, ClassID: ${s.classId?.toString()}, SectionID: ${s.sectionId?.toString()}, AdmNum: ${s.admissionNumber}`);
  }

  // 6. Exams
  const exams = await db.collection('exams').find({}).toArray();
  console.log(`\n=== Exams (${exams.length}) ===`);
  for (const e of exams) {
    console.log(`- ID: ${e._id.toString()}, Name: ${e.name}, ClassID: ${e.classId?.toString()}, Status: ${e.status}`);
  }

  // 7. Results
  const results = await db.collection('results').find({}).toArray();
  console.log(`\n=== Results (${results.length}) ===`);
  for (const r of results) {
    console.log(`- ID: ${r._id.toString()}, ExamID: ${r.examId.toString()}, StudentID: ${r.studentId.toString()}, SubjectID: ${r.subjectId.toString()}, Score: ${r.marksObtained}/${r.maxMarks}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
