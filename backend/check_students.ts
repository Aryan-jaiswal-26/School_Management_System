import mongoose from 'mongoose';
import { Student } from './src/models/Student.js';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school28_db');
  const students = await Student.find();
  console.log('Students count:', students.length);
  console.log('Students:', JSON.stringify(students, null, 2));
  
  const studentUsers = await User.find({ role: 'STUDENT' });
  console.log('Student Users count:', studentUsers.length);
  
  process.exit(0);
}
main().catch(console.error);
