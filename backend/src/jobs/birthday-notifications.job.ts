import cron from 'node-cron';
import { Student } from '../models/Student.js';
import { Employee } from '../models/Employee.js';
import { Notification } from '../models/Notification.js';

export function scheduleBirthdayNotifications() {
  // Run daily at 7:30 AM
  cron.schedule('30 7 * * *', async () => {
    console.log('[CRON] Running birthday notification job...');
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const [students, staff] = await Promise.all([
        Student.find({
          $expr: {
            $and: [
              { $eq: [{ $month: '$dateOfBirth' }, month] },
              { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
            ],
          },
        }).lean(),
        Employee.find({
          $expr: {
            $and: [
              { $eq: [{ $month: '$dateOfBirth' }, month] },
              { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
            ],
          },
        }).lean(),
      ]);

      // Create birthday notifications for students
      for (const student of students) {
        try {
          await Notification.create({
            schoolId: (student as any).schoolId,
            recipientId: (student as any).userId || (student as any)._id,
            title: '🎂 Happy Birthday!',
            message: `Wishing ${(student as any).firstName} ${(student as any).lastName} a very Happy Birthday! 🎉🥳`,
            type: 'birthday',
            channel: 'in-app',
            read: false,
          });
        } catch (e) {
          console.error(`[CRON] Failed to create birthday notification for student ${(student as any)._id}`, e);
        }
      }

      // Create birthday notifications for staff
      for (const emp of staff) {
        try {
          await Notification.create({
            schoolId: (emp as any).schoolId,
            recipientId: (emp as any).userId || (emp as any)._id,
            title: '🎂 Happy Birthday!',
            message: `Wishing ${(emp as any).firstName} ${(emp as any).lastName} a very Happy Birthday from the school family! 🎉`,
            type: 'birthday',
            channel: 'in-app',
            read: false,
          });
        } catch (e) {
          console.error(`[CRON] Failed to create birthday notification for staff ${(emp as any)._id}`, e);
        }
      }

      console.log(`[CRON] Birthday notifications sent: ${students.length} students, ${staff.length} staff`);
    } catch (error) {
      console.error('[CRON] Error in birthday notification job:', error);
    }
  });
}
