import cron from 'node-cron';
import { Exam } from '../models/Exam.js';
import { Notification } from '../models/Notification.js';
import { Student } from '../models/Student.js';

export function scheduleExamReminders() {
  // Run daily at 6:00 PM to remind for next day's exams
  cron.schedule('0 18 * * *', async () => {
    console.log('[CRON] Running exam reminder job...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayStart = new Date(tomorrow);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(23, 59, 59, 999);

      const exams = await Exam.find({
        date: { $gte: dayStart, $lte: dayEnd },
      }).lean();

      if (exams.length === 0) {
        console.log('[CRON] No exams scheduled for tomorrow.');
        return;
      }

      for (const exam of exams) {
        const e = exam as any;
        try {
          // Find all students in the class
          const students = await Student.find({ schoolId: e.schoolId, classId: e.classId }).lean();
          
          for (const student of students) {
            const s = student as any;
            await Notification.create({
              schoolId: e.schoolId,
              recipientId: s.userId || s._id,
              title: '📝 Exam Reminder',
              message: `Reminder: ${e.name} exam is scheduled for tomorrow${e.subject ? ` (${e.subject})` : ''}. Good luck! 🍀`,
              type: 'exam-reminder',
              channel: 'in-app',
              read: false,
            });
          }
        } catch (err) {
          console.error(`[CRON] Failed to send exam reminder for exam ${e._id}`, err);
        }
      }

      console.log(`[CRON] Exam reminders sent for ${exams.length} exams`);
    } catch (error) {
      console.error('[CRON] Error in exam reminder job:', error);
    }
  });
}
