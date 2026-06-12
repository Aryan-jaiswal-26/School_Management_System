import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { HostelRoom } from './src/models/HostelRoom.js';
import { HostelComplaint } from './src/models/HostelComplaint.js';
import { HostelVisitor } from './src/models/HostelVisitor.js';
import { HostelLeave } from './src/models/HostelLeave.js';
import { HostelAttendance } from './src/models/HostelAttendance.js';
import { HostelNotice } from './src/models/HostelNotice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management';

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to:', MONGO_URI);

  console.log('Clearing hostel rooms...');
  const roomsRes = await HostelRoom.deleteMany({});
  console.log('Rooms deleted:', roomsRes.deletedCount);

  console.log('Clearing hostel complaints...');
  const complaintsRes = await HostelComplaint.deleteMany({});
  console.log('Complaints deleted:', complaintsRes.deletedCount);

  console.log('Clearing hostel visitors...');
  const visitorsRes = await HostelVisitor.deleteMany({});
  console.log('Visitors deleted:', visitorsRes.deletedCount);

  console.log('Clearing hostel leaves...');
  const leavesRes = await HostelLeave.deleteMany({});
  console.log('Leaves deleted:', leavesRes.deletedCount);

  console.log('Clearing hostel attendance...');
  const attendanceRes = await HostelAttendance.deleteMany({});
  console.log('Attendance records deleted:', attendanceRes.deletedCount);

  console.log('Clearing hostel notices...');
  const noticesRes = await HostelNotice.deleteMany({});
  console.log('Notices deleted:', noticesRes.deletedCount);

  console.log('Hostel collections cleared successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
