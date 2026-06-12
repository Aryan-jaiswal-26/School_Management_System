import { AuditLog } from '../models/AuditLog.js';
import type { Request } from 'express';
import { Types } from 'mongoose';

export async function logAuditEvent(
  req: Request,
  action: string,
  module: string,
  resourceId?: string | Types.ObjectId,
  changes?: { before?: any; after?: any }
): Promise<void> {
  try {
    if (!req.user) {
      // Don't log if user is not authenticated
      return;
    }

    await AuditLog.create({
      schoolId: req.schoolId ? new Types.ObjectId(req.schoolId) : undefined,
      userId: new Types.ObjectId(req.user.id),
      action: action.toUpperCase(),
      module: module.toUpperCase(),
      resourceId: resourceId?.toString(),
      changes: changes ? {
        before: changes.before,
        after: changes.after
      } : undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error(`[AUDIT LOG ERROR] Failed to record audit log:`, error);
  }
}
