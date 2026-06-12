import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // 1. List all exams
  const exams = await db.collection('exams').find({}).toArray();
  console.log(`\nExams Found (${exams.length}):`);
  for (const e of exams) {
    console.log(`- ID: ${e._id.toString()}, Name: ${e.name}, Subject: ${e.subject}, Grade: ${e.grade}, Status: ${e.status}`);
  }

  // 2. List all results
  const results = await db.collection('results').find({}).toArray();
  console.log(`\nResults Found (${results.length}):`);
  for (const r of results) {
    const studentUser = await db.collection('users').findOne({ _id: r.studentId });
    const studentEmail = studentUser ? studentUser.email : 'Unknown';
    console.log(`- ID: ${r._id.toString()}, Exam ID: ${r.examId.toString()}, Student Email: ${studentEmail}, Marks: ${r.marksObtained}/${r.maxMarks}, Grade: ${r.grade}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
