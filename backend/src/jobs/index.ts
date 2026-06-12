import { scheduleFeeReminders } from './fee-reminders.job.js';

export function scheduleJobs(): void {
  scheduleFeeReminders();
}