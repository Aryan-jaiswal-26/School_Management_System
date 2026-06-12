import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Role } from './src/models/Role.ts';
import { Permission } from './src/models/Permission.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // Test findOne with string schoolId
  const roleName = 'SCHOOL_ADMIN';
  const schoolIdStr = '6a28f3b052204f7a3c753f3f';
  
  const roleDocStr = await Role.findOne({
    name: roleName,
    schoolId: schoolIdStr
  }).populate('permissions');

  console.log('Using string schoolId:', roleDocStr ? 'FOUND' : 'NOT FOUND');
  if (roleDocStr) {
    console.log('Permissions:', (roleDocStr.permissions as any[]).map(p => p.name));
  }

  // Test findOne with ObjectId schoolId
  const roleDocObj = await Role.findOne({
    name: roleName,
    schoolId: new mongoose.Types.ObjectId(schoolIdStr)
  }).populate('permissions');

  console.log('Using ObjectId schoolId:', roleDocObj ? 'FOUND' : 'NOT FOUND');

  process.exit(0);
}

main().catch(console.error);
