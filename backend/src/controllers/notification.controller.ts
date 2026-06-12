import type { NextFunction, Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { sendResponse } from '../utils/response.js';
import { Announcement } from '../models/Announcement.js';
import { Types } from 'mongoose';

export class NotificationController {
  static async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: 'Missing school context' });
        return;
      }

      const notifications = await NotificationService.enqueue({
        schoolId,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'GENERAL',
        channels: req.body.channels || ['PUSH'],
        scheduledAt: req.body.scheduledAt,
        userIds: req.body.userIds,
        link: req.body.link,
      });

      sendResponse(res, 201, 'Notification queued successfully', notifications);
    } catch (error) {
      next(error);
    }
  }

  static async broadcastAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: 'Missing school context' });
        return;
      }

      const notifications = await NotificationService.broadcastAnnouncement(schoolId, {
        schoolId,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'ANNOUNCEMENT',
        channels: req.body.channels || ['PUSH', 'EMAIL'],
        scheduledAt: req.body.scheduledAt,
        userIds: req.body.userIds,
        link: req.body.link,
      });

      sendResponse(res, 201, 'Announcement broadcast queued', notifications);
    } catch (error) {
      next(error);
    }
  }

  static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        res.status(400).json({ success: false, message: 'Missing user context' });
        return;
      }

      const notifications = await NotificationService.listNotifications(schoolId, userId);
      sendResponse(res, 200, 'Notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationId = req.params.notificationId as string;
      const userId = req.user?.id as string;
      const notification = await NotificationService.markAsRead(notificationId, userId);
      sendResponse(res, 200, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }

  static async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const sId = new Types.ObjectId(schoolId as string);
      const announcements = await Announcement.find({
        $or: [
          { schoolId: sId },
          { schoolId: { $exists: false } },
          { schoolId: null }
        ]
      }).sort({ publishedDate: -1 });
      const formatted = announcements.map(a => ({
        id: a._id.toString(),
        title: a.title,
        content: a.content,
        target: (a.targetAudience || 'ALL').toLowerCase(),
        priority: 'normal',
        author: 'Admin',
        date: a.publishedDate ? new Date(a.publishedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        created_at: (a as any).createdAt,
      }));
      sendResponse(res, 200, 'Announcements retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const sId = new Types.ObjectId(schoolId as string);
      const { title, content, target, priority } = req.body;
      const targetMap: Record<string, string> = { all: 'ALL', students: 'STUDENTS', teachers: 'TEACHERS', parents: 'PARENTS' };
      const announcement = new Announcement({
        schoolId: sId,
        title,
        content,
        targetAudience: targetMap[target] || 'ALL',
        publishedDate: new Date(),
        createdBy: new Types.ObjectId(req.user?.id || '000000000000000000000001'),
        updatedBy: new Types.ObjectId(req.user?.id || '000000000000000000000001'),
      });
      await announcement.save();
      sendResponse(res, 201, 'Announcement created', announcement);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || '000000000000000000000001';
      const sId = new Types.ObjectId(schoolId as string);
      const { id } = req.params;
      await Announcement.findOneAndDelete({ schoolId: sId, _id: new Types.ObjectId(id as string) });
      sendResponse(res, 200, 'Announcement deleted', null);
    } catch (error) {
      next(error);
    }
  }
}
