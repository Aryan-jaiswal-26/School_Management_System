import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { EmergencyDrill } from '../models/EmergencyDrill.js';
import { MissingStudentAlert } from '../models/MissingStudentAlert.js';
import { LockdownAlert } from '../models/LockdownAlert.js';
import { sendResponse } from '../utils/response.js';

export class SafetyController {
  // ─── Emergency Drills ────────────────────────────────────────────────────────

  static async listDrills(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const { status, type, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [drills, total] = await Promise.all([
      EmergencyDrill.find(filter)
        .sort({ scheduledDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      EmergencyDrill.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Emergency drills retrieved', {
      drills,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  }

  static async createDrill(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const { type, scheduledDate, duration, description, location, coordinator, nextDrillDate } = req.body;

    if (!type || !scheduledDate || !description || !location || !coordinator) {
      sendResponse(res, 400, 'Missing required fields: type, scheduledDate, description, location, coordinator', null);
      return;
    }

    const drill = await EmergencyDrill.create({
      schoolId: new Types.ObjectId(schoolId),
      type,
      scheduledDate: new Date(scheduledDate),
      duration: duration ?? 30,
      description,
      location,
      coordinator,
      status: 'scheduled',
      nextDrillDate: nextDrillDate ? new Date(nextDrillDate) : undefined,
    });

    sendResponse(res, 201, 'Emergency drill scheduled', drill);
  }

  static async updateDrill(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const { id } = req.params;

    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const drill = await EmergencyDrill.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) });
    if (!drill) {
      sendResponse(res, 404, 'Emergency drill not found', null);
      return;
    }

    const allowedUpdates: Array<keyof typeof drill> = [
      'status', 'completionNotes', 'participantCount', 'issues',
      'nextDrillDate', 'scheduledDate', 'duration', 'description',
      'location', 'coordinator',
    ] as any;

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        (drill as any)[key] = req.body[key];
      }
    }

    await drill.save();
    sendResponse(res, 200, 'Emergency drill updated', drill);
  }

  // ─── Missing Student Alerts ───────────────────────────────────────────────────

  static async listMissingAlerts(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (status) filter.status = status;

    const alerts = await MissingStudentAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('reportedBy', 'fullName email')
      .populate('resolvedBy', 'fullName email')
      .lean();

    sendResponse(res, 200, 'Missing student alerts retrieved', alerts);
  }

  static async createMissingAlert(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const reportedBy = (req as any).user?.id;

    if (!schoolId || !reportedBy) {
      sendResponse(res, 400, 'Missing user or school context', null);
      return;
    }

    const { studentId, studentName, grade, lastSeenAt, lastSeenLocation, description, photos } = req.body;

    if (!studentId || !studentName || !grade || !lastSeenAt || !lastSeenLocation || !description) {
      sendResponse(res, 400, 'Missing required fields', null);
      return;
    }

    const alert = await MissingStudentAlert.create({
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(studentId),
      studentName,
      grade,
      lastSeenAt: new Date(lastSeenAt),
      lastSeenLocation,
      description,
      reportedBy: new Types.ObjectId(reportedBy),
      status: 'active',
      photos: photos ?? [],
    });

    sendResponse(res, 201, 'Missing student alert created', alert);
  }

  static async resolveMissingAlert(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const resolvedBy = (req as any).user?.id;
    const { id } = req.params;

    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const alert = await MissingStudentAlert.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) });
    if (!alert) {
      sendResponse(res, 404, 'Missing student alert not found', null);
      return;
    }

    const { status, resolutionNotes } = req.body;
    alert.status = status ?? 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy ? new Types.ObjectId(resolvedBy) : undefined;
    alert.resolutionNotes = resolutionNotes;

    await alert.save();
    sendResponse(res, 200, 'Missing student alert resolved', alert);
  }

  // ─── Lockdown Alerts ──────────────────────────────────────────────────────────

  static async listLockdowns(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
    if (status) filter.status = status;

    const lockdowns = await LockdownAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('issuedBy', 'fullName email role')
      .populate('liftedBy', 'fullName email')
      .lean();

    sendResponse(res, 200, 'Lockdown alerts retrieved', lockdowns);
  }

  static async issueLockdown(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const issuedBy = (req as any).user?.id;

    if (!schoolId || !issuedBy) {
      sendResponse(res, 400, 'Missing user or school context', null);
      return;
    }

    const { reason, level, instructions, affectedAreas, notifiedParents, notifiedStaff } = req.body;

    if (!reason || !level || !instructions) {
      sendResponse(res, 400, 'Missing required fields: reason, level, instructions', null);
      return;
    }

    const lockdown = await LockdownAlert.create({
      schoolId: new Types.ObjectId(schoolId),
      issuedBy: new Types.ObjectId(issuedBy),
      reason,
      level,
      instructions,
      affectedAreas: affectedAreas ?? [],
      status: 'active',
      notifiedParents: notifiedParents ?? false,
      notifiedStaff: notifiedStaff ?? false,
    });

    sendResponse(res, 201, 'Lockdown alert issued', lockdown);
  }

  static async liftLockdown(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    const liftedBy = (req as any).user?.id;
    const { id } = req.params;

    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const lockdown = await LockdownAlert.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) });
    if (!lockdown) {
      sendResponse(res, 404, 'Lockdown alert not found', null);
      return;
    }

    if (lockdown.status !== 'active') {
      sendResponse(res, 400, 'Lockdown is not currently active', null);
      return;
    }

    const { status } = req.body;
    lockdown.status = status === 'false-alarm' ? 'false-alarm' : 'lifted';
    lockdown.liftedAt = new Date();
    lockdown.liftedBy = liftedBy ? new Types.ObjectId(liftedBy) : undefined;

    await lockdown.save();
    sendResponse(res, 200, 'Lockdown alert lifted', lockdown);
  }
}
