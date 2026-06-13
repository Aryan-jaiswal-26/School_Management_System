import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { sendResponse } from '../utils/response.js';

export async function getAuditLogs(req: Request, res: Response) {
  const schoolId = req.user?.schoolId || req.body.schoolId;
  if (!schoolId) {
    return sendResponse(res, 400, 'School context required', null);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Build the query
    const query: any = { schoolId };

    if (req.query.module) {
      query.module = req.query.module.toString().toUpperCase();
    }
    
    if (req.query.action) {
      query.action = req.query.action.toString().toUpperCase();
    }

    if (req.query.search) {
      const searchStr = req.query.search.toString();
      
      // Look up users first to support searching by user name/email
      const matchedUsers = await User.find({
        schoolId,
        $or: [
          { firstName: { $regex: searchStr, $options: 'i' } },
          { lastName: { $regex: searchStr, $options: 'i' } },
          { email: { $regex: searchStr, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = matchedUsers.map(u => u._id);

      query.$or = [
        { action: { $regex: searchStr, $options: 'i' } },
        { module: { $regex: searchStr, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return sendResponse(res, 200, 'Audit logs retrieved successfully', {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return sendResponse(res, 500, error.message || 'Failed to retrieve audit logs', null);
  }
}

export class AuditController {
  /**
   * GET /audit/logs
   * Paginated audit log query.
   * Query params: userId, action, module, resourceId, startDate, endDate, page, limit
   */
  static async getAuditLogs(req: Request, res: Response): Promise<Response> {
    const schoolId = (req as any).user?.schoolId;
    const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit    = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const skip     = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // SUPER_ADMIN can see all schools; SCHOOL_ADMIN is scoped
    const role = (req as any).user?.role;
    if (role !== 'SUPER_ADMIN') {
      filter.schoolId = new mongoose.Types.ObjectId(schoolId);
    }

    if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) {
        return sendResponse(res, 400, 'Invalid userId filter');
      }
      filter.userId = new mongoose.Types.ObjectId(String(req.query.userId));
    }

    if (req.query.action) {
      filter.action = String(req.query.action).toUpperCase();
    }

    if (req.query.module) {
      filter.module = String(req.query.module).toUpperCase();
    }

    if (req.query.resourceId) {
      filter.resourceId = String(req.query.resourceId);
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (req.query.startDate) {
        const d = new Date(String(req.query.startDate));
        if (isNaN(d.getTime())) return sendResponse(res, 400, 'Invalid startDate');
        dateFilter.$gte = d;
      }
      if (req.query.endDate) {
        const d = new Date(String(req.query.endDate));
        if (isNaN(d.getTime())) return sendResponse(res, 400, 'Invalid endDate');
        d.setHours(23, 59, 59, 999);
        dateFilter.$lte = d;
      }
      filter.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return sendResponse(res, 200, 'Audit logs fetched successfully', {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  /**
   * GET /audit/activity
   * Paginated activity log query.
   * Query params: userId, activityType, startDate, endDate, page, limit
   */
  static async getActivityLogs(req: Request, res: Response): Promise<Response> {
    const schoolId = (req as any).user?.schoolId;
    const role     = (req as any).user?.role;
    const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit    = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const skip     = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (role !== 'SUPER_ADMIN') {
      filter.schoolId = new mongoose.Types.ObjectId(schoolId);
    }

    if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) {
        return sendResponse(res, 400, 'Invalid userId filter');
      }
      filter.userId = new mongoose.Types.ObjectId(String(req.query.userId));
    }

    if (req.query.activityType) {
      const validTypes = ['LOGIN', 'LOGOUT', 'PAGE_VIEW', 'SEARCH'];
      const type = String(req.query.activityType).toUpperCase();
      if (!validTypes.includes(type)) {
        return sendResponse(res, 400, `activityType must be one of ${validTypes.join(', ')}`);
      }
      filter.activityType = type;
    }

    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (req.query.startDate) {
        const d = new Date(String(req.query.startDate));
        if (isNaN(d.getTime())) return sendResponse(res, 400, 'Invalid startDate');
        dateFilter.$gte = d;
      }
      if (req.query.endDate) {
        const d = new Date(String(req.query.endDate));
        if (isNaN(d.getTime())) return sendResponse(res, 400, 'Invalid endDate');
        d.setHours(23, 59, 59, 999);
        dateFilter.$lte = d;
      }
      filter.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email role')
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return sendResponse(res, 200, 'Activity logs fetched successfully', {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  /**
   * GET /audit/my-activity
   * Returns the calling user's own activity logs.
   */
  static async getMyActivity(req: Request, res: Response): Promise<Response> {
    const userId = (req as any).user?.id;
    const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip   = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (req.query.activityType) {
      filter.activityType = String(req.query.activityType).toUpperCase();
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      message: 'My activity fetched successfully',
      data: {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }
    });
  }
}

