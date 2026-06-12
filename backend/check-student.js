import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function check() {
  await mongoose.connect(dbUrl);
  
  console.log('--- CLASSES ---');
  const classes = await mongoose.connection.db.collection('classes').find().toArray();
  console.log(classes.map(c => ({ id: c._id, name: c.name, schoolId: c.schoolId })));

  console.log('--- SECTIONS ---');
  const sections = await mongoose.connection.db.collection('sections').find().toArray();
  console.log(sections.map(s => ({ id: s._id, classId: s.classId, name: s.name, schoolId: s.schoolId })));

  await mongoose.disconnect();
}
check();
