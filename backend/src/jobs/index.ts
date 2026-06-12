import cron from 'node-cron';
import mongoose from 'mongoose';
import { Student } from '../models/Student.js';
import { Employee } from '../models/Employee.js';
import { Fee } from '../models/Fee.js';
import { Exam } from '../models/Exam.js';
import { Notification } from '../models/Notification.js';
import { scheduleFeeReminders } from './fee-reminders.job.js';

// ---------------------------------------------------------------------------
// Helper: safely run a cron task with top-level error handling
// ---------------------------------------------------------------------------
function safeCron(expression: string, label: string, task: () => Promise<void>): void {
  cron.schedule(expression, async () => {
    try {
      await task();
    } catch (err) {
      console.error(`[Cron][${label}] Error:`, err);
    }
  });
}

// ---------------------------------------------------------------------------
// Birthday notifications – runs at 08:00 every day
// ---------------------------------------------------------------------------
async function sendBirthdayNotifications(): Promise<void> {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-indexed
  const day   = today.getDate();

  const dateExpr = {
    $and: [
      { $eq: [{ $month: '$dateOfBirth' }, month] },
      { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
    ],
  };

  // Student model stores DOB as `dob`
  const studentDateExpr = {
    $and: [
      { $eq: [{ $month: '$dob' }, month] },
      { $eq: [{ $dayOfMonth: '$dob' }, day] },
    ],
  };

  const [students, staff] = await Promise.all([
    Student.find({ $expr: studentDateExpr }).select('schoolId userId firstName lastName').lean(),
    Employee.find({ $expr: dateExpr }).select('schoolId userId firstName lastName').lean(),
  ]);

  const notifications: {
    schoolId: mongoose.Types.ObjectId;
    userId:   mongoose.Types.ObjectId;
    title:    string;
    message:  string;
    type:     string;
    channels: string[];
  }[] = [];

  for (const student of students) {
    if (!student.schoolId || !student.userId) continue;
    notifications.push({
      schoolId: student.schoolId as mongoose.Types.ObjectId,
      userId:   student.userId   as mongoose.Types.ObjectId,
      title:    '🎂 Happy Birthday!',
      message:  `Wishing you a very happy birthday! 🎉`,
      type:     'BIRTHDAY',
      channels: ['IN_APP'],
    });
  }

  for (const employee of staff) {
    if (!employee.schoolId || !employee.userId) continue;
    notifications.push({
      schoolId: employee.schoolId as mongoose.Types.ObjectId,
      userId:   employee.userId   as mongoose.Types.ObjectId,
      title:    '🎂 Happy Birthday!',
      message:  `Wishing you a very happy birthday! 🎉`,
      type:     'BIRTHDAY',
      channels: ['IN_APP'],
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  console.log(
    `[Cron][Birthday] Sent ${students.length} student + ${staff.length} staff birthday notifications`,
  );
}

// ---------------------------------------------------------------------------
// Fee due reminders – runs at 09:00 every day
// ---------------------------------------------------------------------------
async function sendFeeDueReminders(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const dueFees = await Fee.find({
    status:  { $in: ['PENDING', 'PARTIAL'] },
    dueDate: { $gte: today, $lte: threeDaysFromNow },
  })
    .populate<{ studentId: { schoolId: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId } }>(
      'studentId',
      'schoolId userId',
    )
    .lean();

  const notifications: {
    schoolId: mongoose.Types.ObjectId;
    userId:   mongoose.Types.ObjectId;
    title:    string;
    message:  string;
    type:     string;
    channels: string[];
  }[] = [];

  for (const fee of dueFees) {
    if (!fee.studentId || typeof fee.studentId !== 'object') continue;
    const student = fee.studentId as { schoolId: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId };
    if (!student.schoolId || !student.userId) continue;

    notifications.push({
      schoolId: student.schoolId,
      userId:   student.userId,
      title:    '💳 Fee Due Reminder',
      message:  `Fee payment of ₹${fee.amount} is due on ${fee.dueDate.toLocaleDateString('en-IN')}. Please pay before the due date to avoid late charges.`,
      type:     'FEE_REMINDER',
      channels: ['IN_APP'],
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  console.log(`[Cron][FeeReminder] Sent ${notifications.length} fee due reminders`);
}

// ---------------------------------------------------------------------------
// Exam reminders – runs at 07:00 every day (reminds for tomorrow's exams)
// ---------------------------------------------------------------------------
async function sendExamReminders(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayStart = new Date(tomorrow);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(tomorrow);
  dayEnd.setHours(23, 59, 59, 999);

  // Exams that START tomorrow
  const exams = await Exam.find({
    startDate: { $gte: dayStart, $lte: dayEnd },
    status:    { $in: ['UPCOMING', 'ONGOING'] },
  }).lean();

  const notifications: {
    schoolId: mongoose.Types.ObjectId;
    userId:   mongoose.Types.ObjectId;
    title:    string;
    message:  string;
    type:     string;
    channels: string[];
  }[] = [];

  for (const exam of exams) {
    // Notify the school-wide (we use a sentinel userId = schoolId since
    // userId is required — in production you'd fan out to enrolled students)
    notifications.push({
      schoolId: exam.schoolId as mongoose.Types.ObjectId,
      userId:   exam.schoolId as unknown as mongoose.Types.ObjectId, // placeholder fan-out
      title:    '📝 Exam Tomorrow',
      message:  `Reminder: "${exam.name}" exam is scheduled for tomorrow${exam.subject ? ` (${exam.subject})` : ''}. Best of luck!`,
      type:     'EXAM_REMINDER',
      channels: ['IN_APP'],
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  console.log(`[Cron][ExamReminder] Sent reminders for ${exams.length} upcoming exams`);
}

// ---------------------------------------------------------------------------
// Overdue fees – runs at midnight every day
// ---------------------------------------------------------------------------
async function markOverdueFees(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await Fee.updateMany(
    { status: { $in: ['PENDING', 'PARTIAL'] }, dueDate: { $lt: today } },
    { $set: { status: 'OVERDUE' } },
  );

  console.log(`[Cron][OverdueFees] Marked ${result.modifiedCount} fees as OVERDUE`);
}

// ---------------------------------------------------------------------------
// Entry point – called from server.ts
// ---------------------------------------------------------------------------
export function scheduleJobs(): void {
  // Pre-existing job from fee-reminders.job.ts
  scheduleFeeReminders();

  // Birthday notifications at 08:00 daily
  safeCron('0 8 * * *', 'Birthday', sendBirthdayNotifications);

  // Fee due reminders at 09:00 daily
  safeCron('0 9 * * *', 'FeeReminder', sendFeeDueReminders);

  // Exam reminders at 07:00 daily
  safeCron('0 7 * * *', 'ExamReminder', sendExamReminders);

  // Mark overdue fees at midnight
  safeCron('0 0 * * *', 'OverdueFees', markOverdueFees);

  console.log('[Cron] All scheduled jobs started ✅');
}