import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;

  // Find all parent users
  const parentUsers = await db.collection('users').find({ role: 'PARENT' }).toArray();
  console.log(`\n✅ Total Parent Users Found: ${parentUsers.length}`);

  for (const parentUser of parentUsers) {
    console.log('\n  --- Parent User ---');
    console.log('  ID   :', parentUser._id.toString());
    console.log('  Email:', parentUser.email);
    console.log('  Name :', parentUser.firstName, parentUser.lastName);
    
    // Check if password matches 12345678 or ParentPass123!
    const matches12345678 = await bcrypt.compare('12345678', parentUser.passwordHash);
    const matchesDefault = await bcrypt.compare('ParentPass123!', parentUser.passwordHash);
    console.log('  Matches "12345678"       :', matches12345678 ? 'YES' : 'NO');
    console.log('  Matches "ParentPass123!" :', matchesDefault ? 'YES' : 'NO');

    // Find parent doc
    const parentDoc = await db.collection('parents').findOne({ userId: parentUser._id });
    if (parentDoc) {
      console.log('  ✅ Parent Doc Found');
      
      // Find all students linked to this parent
      const students = await db.collection('students').find({ parentIds: parentDoc._id }).toArray();
      console.log(`  ✅ Linked Students (${students.length}):`);
      for (const s of students) {
        const studentUser = await db.collection('users').findOne({ _id: s.userId });
        console.log(`  - Admission #: ${s.admissionNumber}, Name: ${studentUser?.firstName} ${studentUser?.lastName}, Email: ${studentUser?.email}`);
      }
    } else {
      console.log('❌ No parent document found for this user.');
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
