import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:');
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${count}`);
  }
  
  const students = await mongoose.connection.db.collection('students').find().toArray();
  console.log('Students in school_management:', students.length);
  if (students.length > 0) {
    console.log('Sample student schoolId:', students[0].schoolId, typeof students[0].schoolId);
  }
  
  const users = await mongoose.connection.db.collection('users').find().toArray();
  console.log('Users in school_management:', users.length);
  for (const u of users) {
    console.log(`- _id: ${u._id}, role: ${u.role}, email: ${u.email}, schoolId: ${u.schoolId}`);
  }
  
  const userObj = await mongoose.connection.db.collection('users').findOne({ email: 'singh@gmail.com' });
  console.log('User singh@gmail.com details:');
  console.log(userObj);
  if (userObj) {
    console.log('schoolId type:', typeof userObj.schoolId, userObj.schoolId instanceof mongoose.Types.ObjectId ? 'ObjectId' : 'not ObjectId');
  }

  process.exit(0);
}
main().catch(console.error);
