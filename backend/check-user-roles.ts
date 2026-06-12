import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  const db = mongoose.connection.db;

  console.log('\n--- Active Roles and their Permissions ---');
  const roles = await db.collection('roles').find().toArray();
  const permissions = await db.collection('permissions').find().toArray();
  const permMap = new Map(permissions.map(p => [p._id.toString(), p]));

  for (const role of roles) {
    const permIds = role.permissions || [];
    const permNames = permIds.map((id: any) => {
      const p = permMap.get(id.toString());
      return p ? p.name : id.toString();
    });
    console.log(`Role: ${role.name} | School ID: ${role.schoolId} | Permissions (${permNames.length}):`, permNames);
  }

  console.log('\n--- Users with Roles ---');
  const users = await db.collection('users').find({ role: { $in: ['SCHOOL_ADMIN', 'TEACHER'] } }).toArray();
  for (const user of users) {
    console.log(`User: ${user.email} | Role: ${user.role} | School ID: ${user.schoolId}`);
  }

  process.exit(0);
}

main().catch(console.error);
