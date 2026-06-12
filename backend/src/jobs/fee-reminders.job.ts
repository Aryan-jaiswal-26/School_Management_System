import cron from 'node-cron';
import { Fee } from '../models/Fee.js';
import { NotificationService } from '../services/notification.service.js';

export function scheduleFeeReminders() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running daily fee reminder job...');
    try {
      const now = new Date();
      
      // Find all overdue or pending fees where the due date has passed
      const overdueFees = await Fee.find({
        status: { $in: ['PENDING', 'PARTIAL'] },
        dueDate: { $lt: now }
      }).populate('studentId').lean();

      if (overdueFees.length === 0) {
        console.log('[CRON] No overdue fees found.');
        return;
      }

      console.log(`[CRON] Found ${overdueFees.length} overdue fees. Generating reminders...`);

      // Group overdue fees by school to enqueue notifications efficiently
      const feesBySchool = overdueFees.reduce((acc, fee: any) => {
        const sid = fee.schoolId.toString();
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(fee);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [schoolId, fees] of Object.entries(feesBySchool)) {
        for (const fee of fees) {
          const studentName = fee.studentId?.firstName || 'Student';
          const parentId = fee.studentId?.parentId;

          if (!parentId) continue; // Cannot notify without parent

          await NotificationService.enqueue({
            schoolId,
            userIds: [parentId.toString()],
            title: 'Overdue Fee Reminder',
            message: `Dear Parent, this is a reminder that the ${fee.feeType} fee for ${studentName} is overdue. Please pay at your earliest convenience to avoid penalties.`,
            type: 'FEE_REMINDER',
            channels: ['PUSH', 'SMS'],
          });
        }
      }

      console.log('[CRON] Fee reminders queued successfully.');
    } catch (error) {
      console.error('[CRON] Error running fee reminder job:', error);
    }
  });
}
