import mongoose from 'mongoose';
import { env } from './backend/src/config/env.js';
import { AttendanceService } from './backend/src/services/attendance.service.js';

async function main() {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log('Connected to DB');
    const schoolId = '000000000000000000000001'; // use dummy school id
    const userId = '000000000000000000000001';
    const payload = [
      {
        session_date: new Date().toISOString().split('T')[0],
        grade: '10',
        section: 'A',
        student_id: '000000000000000000000001',
        student_name: 'Test Student',
        status: 'PRESENT',
        remarks: 'On time'
      }
    ];
    const result = await AttendanceService.markStudentAttendanceBulk(schoolId, userId, payload);
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
