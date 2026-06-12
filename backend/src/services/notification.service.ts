import { Types } from 'mongoose';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/api-error.js';
import { broadcastNotification } from '../socket/index.js';
import { SMSService } from './sms.service.js';

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS';

interface BaseNotificationPayload {
  schoolId: string;
  title: string;
  message: string;
  type?: string;
  channels?: NotificationChannel[];
  link?: string;
  scheduledAt?: string | Date;
  userIds?: string[];
}

interface QueueRecord {
  timeout: NodeJS.Timeout;
  notificationId: string;
}

const queue = new Map<string, QueueRecord>();
const MAX_RETRIES = 3;

function toDelayMs(scheduledAt?: string | Date): number {
  if (!scheduledAt) return 0;
  const target = new Date(scheduledAt).getTime();
  return Math.max(0, target - Date.now());
}

function scheduleDelivery(notificationId: string, delayMs: number): void {
  const existing = queue.get(notificationId);
  if (existing) clearTimeout(existing.timeout);

  const timeout = setTimeout(async () => {
    queue.delete(notificationId);
    await NotificationService.deliver(notificationId);
  }, delayMs);

  queue.set(notificationId, { timeout, notificationId });
}

export class NotificationService {
  static async enqueue(payload: BaseNotificationPayload) {
    const schoolId = new Types.ObjectId(payload.schoolId);
    const userIds = payload.userIds && payload.userIds.length > 0
      ? payload.userIds.map((id) => new Types.ObjectId(id))
      : await User.find({ schoolId, isActive: true }).distinct('_id');

    if (userIds.length === 0) {
      throw new ApiError(400, 'No recipients available for this notification');
    }

    const notifications = await Promise.all(
      userIds.map(async (userId) => {
        const record = await Notification.create({
          schoolId,
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type || 'GENERAL',
          channels: payload.channels || ['PUSH'],
          status: 'QUEUED',
          isRead: false,
          scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
          attempts: 0,
          maxAttempts: MAX_RETRIES,
          link: payload.link,
        });

        return record;
      }),
    );

    notifications.forEach((notification) => {
      const delayMs = toDelayMs(notification.scheduledAt ?? payload.scheduledAt);
      scheduleDelivery(notification._id.toString(), delayMs);
    });

    return notifications;
  }

  static async deliver(notificationId: string): Promise<void> {
    const notification = await Notification.findById(notificationId);
    if (!notification) return;

    try {
      const channels = (notification.channels ?? ['PUSH']) as NotificationChannel[];
      for (const channel of channels) {
        await NotificationService.send(channel, notification);
      }

      notification.status = 'SENT';
      notification.attempts += 1;
      notification.lastError = undefined;
      await notification.save();

      broadcastNotification({
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        channels,
      });
    } catch (error) {
      notification.attempts += 1;
      notification.status = notification.attempts >= notification.maxAttempts ? 'FAILED' : 'QUEUED';
      notification.lastError = error instanceof Error ? error.message : 'Unknown delivery error';
      await notification.save();

      if (notification.status === 'QUEUED') {
        const retryDelay = Math.min(300000, 1000 * 2 ** Math.max(0, notification.attempts - 1));
        scheduleDelivery(notification._id.toString(), retryDelay);
      }
    }
  }

  static async send(channel: NotificationChannel, notification: any): Promise<void> {
    const target = `${notification.title} — ${notification.message}`;

    switch (channel) {
      case 'EMAIL':
        console.info(`[EMAIL] ${target}`);
        return;
      case 'SMS':
        console.info(`[SMS] ${target}`);
        if (notification.userId) {
          const user = await User.findById(notification.userId) as any;
          if (user && (user.phone || user.phoneNumber)) {
            await SMSService.sendSMS(user.phone || user.phoneNumber, target);
          } else {
            console.warn(`[SMS] User ${notification.userId} does not have a phone number.`);
          }
        }
        return;
      case 'PUSH':
      default:
        console.info(`[PUSH] ${target}`);
        return;
    }
  }

  static async listNotifications(schoolId: string, userId: string) {
    return Notification.find({ schoolId: new Types.ObjectId(schoolId), userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOne({ _id: notificationId, userId: new Types.ObjectId(userId) });
    if (!notification) throw new ApiError(404, 'Notification not found');

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  static async broadcastAnnouncement(schoolId: string, payload: BaseNotificationPayload) {
    const userIds = payload.userIds && payload.userIds.length > 0
      ? payload.userIds
      : (await User.find({ schoolId: new Types.ObjectId(schoolId), isActive: true }).distinct('_id')).map((id) => id.toString());

    return this.enqueue({
      schoolId,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'ANNOUNCEMENT',
      channels: payload.channels || ['PUSH', 'EMAIL'],
      scheduledAt: payload.scheduledAt,
      userIds,
      link: payload.link,
    });
  }
}
