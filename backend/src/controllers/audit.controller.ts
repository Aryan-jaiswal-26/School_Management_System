import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
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
