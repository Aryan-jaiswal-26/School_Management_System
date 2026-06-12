import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { EmergencyAlert } from '../models/EmergencyAlert.js';
import { User } from '../models/User.js';
import { NotificationService } from '../services/notification.service.js';
import { sendResponse } from '../utils/response.js';

function mapAudienceToRoles(targetAudience: string): string[] {
  switch (targetAudience) {
    case 'PARENTS':
      return ['PARENT'];
    case 'STUDENTS':
      return ['STUDENT'];
    case 'TEACHERS':
      return ['TEACHER'];
    case 'STAFF':
      return ['SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'DRIVER'];
    case 'ALL':
    default:
      return ['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'DRIVER', 'ACCOUNTANT'];
  }
}

async function resolveRecipients(schoolId: Types.ObjectId, targetAudience: string): Promise<string[]> {
  const roles = mapAudienceToRoles(targetAudience);
  const ids = await User.distinct('_id', {
    schoolId,
    isActive: true,
    role: { $in: roles as any },
  } as any);
  return ids.map((id) => id.toString());
}

export class EmergencyController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: 'Missing school context' });
        return;
      }

      const alerts = await EmergencyAlert.find({
        schoolId: new Types.ObjectId(schoolId),
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      sendResponse(
        res,
        200,
        'Emergency alerts retrieved',
        alerts.map((alert: any) => ({
          id: alert._id?.toString?.() || alert.id,
          title: alert.title,
          message: alert.message,
          category: alert.category,
          severity: alert.severity,
          targetAudience: alert.targetAudience,
          sourceRole: alert.sourceRole,
          sourceName: alert.sourceName,
          status: alert.status,
          createdAt: alert.createdAt,
          acknowledgedByCount: (alert.acknowledgedBy || []).length,
        })),
      );
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: 'Missing school context' });
        return;
      }

      const alert = new EmergencyAlert({
        schoolId: new Types.ObjectId(schoolId),
        title: req.body.title,
        message: req.body.message,
        category: req.body.category,
        severity: req.body.severity || 'HIGH',
        targetAudience: req.body.targetAudience || 'ALL',
        sourceRole: req.user?.role || 'UNKNOWN',
        sourceName: req.user?.fullName || 'Campus User',
        status: req.body.status || 'OPEN',
        createdBy: req.user?.id,
      });

      await alert.save();

      const recipients = await resolveRecipients(new Types.ObjectId(schoolId), alert.targetAudience);
      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId,
          title: `[${alert.category}] ${alert.title}`,
          message: alert.message,
          type: 'EMERGENCY',
          channels: alert.severity === 'CRITICAL' ? ['PUSH', 'SMS', 'EMAIL'] : ['PUSH', 'EMAIL'],
          userIds: recipients,
          link: '/admin/safety',
        });
      }

      sendResponse(res, 201, 'Emergency alert created', {
        id: alert._id.toString(),
        title: alert.title,
        message: alert.message,
        category: alert.category,
        severity: alert.severity,
        targetAudience: alert.targetAudience,
        sourceRole: alert.sourceRole,
        sourceName: alert.sourceName,
        status: alert.status,
      });
    } catch (error) {
      next(error);
    }
  }

  static async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alert = await EmergencyAlert.findById(req.params.id);
      if (!alert) {
        res.status(404).json({ success: false, message: 'Emergency alert not found' });
        return;
      }

      alert.status = 'ACKNOWLEDGED';
      if (req.user?.id) {
        const current = alert.acknowledgedBy || [];
        if (!current.some((id) => id.toString() === req.user?.id)) {
          current.push(new Types.ObjectId(req.user.id));
          alert.acknowledgedBy = current;
        }
      }

      await alert.save();

      sendResponse(res, 200, 'Emergency alert acknowledged', {
        id: alert._id.toString(),
        status: alert.status,
      });
    } catch (error) {
      next(error);
    }
  }
}
