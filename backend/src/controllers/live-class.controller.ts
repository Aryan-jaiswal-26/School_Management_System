import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Employee } from '../models/Employee.js';
import { LiveClassSession } from '../models/LiveClassSession.js';
import { Student } from '../models/Student.js';
import { sendResponse } from '../utils/response.js';

function toId(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (typeof value.toString === 'function') return value.toString();
  return '';
}

function displayName(user: any): string {
  if (!user) return 'Faculty';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || 'Faculty';
}

function buildMeetLink(provider: string, meetingLink?: string, meetingCode?: string): string {
  if (meetingLink) return meetingLink;
  if (provider === 'ZOOM') return 'https://zoom.us/j/meeting';
  if (meetingCode) return `https://meet.google.com/${meetingCode}`;
  return 'https://meet.google.com/new';
}

export class LiveClassController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        res.status(400).json({ success: false, message: 'Missing school context' });
        return;
      }

      const schoolObjectId = new Types.ObjectId(schoolId);
      const sessions = await LiveClassSession.find({
        schoolId: schoolObjectId,
        isDeleted: false,
      })
        .populate({
          path: 'teacherId',
          select: 'userId designation',
          populate: { path: 'userId', select: 'firstName lastName email phoneNumber' },
        })
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .sort({ scheduledAt: -1 })
        .lean();

      let filtered = sessions;

      if (req.user?.role === 'TEACHER') {
        const teacher = await Employee.findOne({
          schoolId: schoolObjectId,
          userId: req.user.id,
          employeeType: 'TEACHING',
        }).lean();

        const teacherId = teacher?._id?.toString();
        filtered = sessions.filter((session: any) => {
          const sessionTeacherId = toId(session.teacherId);
          return sessionTeacherId === teacherId || toId(session.createdBy) === req.user?.id;
        });
      } else if (req.user?.role === 'STUDENT' || req.user?.role === 'PARENT') {
        const student = await Student.findOne({
          schoolId: schoolObjectId,
          userId: req.user.id,
          isDeleted: false,
        }).lean();

        if (student) {
          filtered = sessions.filter((session: any) => {
            const classId = toId(session.classId);
            const sectionId = toId(session.sectionId);
            const matchesClass = !classId || classId === student.classId.toString();
            const matchesSection = !sectionId || sectionId === student.sectionId.toString();
            return matchesClass && matchesSection && session.status !== 'CANCELLED';
          });
        } else {
          filtered = sessions.filter((session: any) => session.status !== 'CANCELLED');
        }
      }

      const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit = Number(req.query.limit || 20);

      const mapped = filtered
        .filter((session: any) => !statusFilter || session.status === statusFilter)
        .map((session: any) => ({
          id: toId(session),
          title: session.title,
          subject: session.subject,
          description: session.description || '',
          scheduledAt: session.scheduledAt,
          durationMinutes: session.durationMinutes,
          provider: session.provider,
          meetingLink: session.meetingLink,
          meetingCode: session.meetingCode,
          status: session.status,
          recordingUrl: session.recordingUrl,
          studyMaterialLinks: session.studyMaterialLinks || [],
          className: (session.classId as any)?.name || '',
          sectionName: (session.sectionId as any)?.name || '',
          teacherName: displayName((session.teacherId as any)?.userId),
          teacherDesignation: (session.teacherId as any)?.designation || '',
          isLive: session.status === 'LIVE',
        }))
        .slice(0, limit);

      sendResponse(res, 200, 'Live classes retrieved', mapped);
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

      const teacher = await Employee.findOne({
        schoolId: new Types.ObjectId(schoolId),
        userId: req.user?.id,
        employeeType: 'TEACHING',
      }).lean();

      if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher profile not found' });
        return;
      }

      const session = new LiveClassSession({
        schoolId: new Types.ObjectId(schoolId),
        title: req.body.title,
        subject: req.body.subject,
        teacherId: teacher._id,
        classId: req.body.classId,
        sectionId: req.body.sectionId,
        scheduledAt: new Date(req.body.scheduledAt),
        durationMinutes: req.body.durationMinutes,
        provider: req.body.provider || 'GOOGLE_MEET',
        meetingLink: buildMeetLink(req.body.provider || 'GOOGLE_MEET', req.body.meetingLink, req.body.meetingCode),
        meetingCode: req.body.meetingCode,
        description: req.body.description,
        studyMaterialLinks: req.body.studyMaterialLinks || [],
        status: req.body.status || 'SCHEDULED',
        createdBy: req.user?.id,
      });

      await session.save();

      const populated = await LiveClassSession.findById(session._id)
        .populate({
          path: 'teacherId',
          select: 'userId designation',
          populate: { path: 'userId', select: 'firstName lastName email phoneNumber' },
        })
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .lean();

      sendResponse(res, 201, 'Live class scheduled', {
        id: toId(populated || session),
        title: (populated as any)?.title || session.title,
        subject: (populated as any)?.subject || session.subject,
        scheduledAt: (populated as any)?.scheduledAt || session.scheduledAt,
        durationMinutes: (populated as any)?.durationMinutes || session.durationMinutes,
        provider: (populated as any)?.provider || session.provider,
        meetingLink: (populated as any)?.meetingLink || session.meetingLink,
        meetingCode: (populated as any)?.meetingCode || session.meetingCode,
        status: (populated as any)?.status || session.status,
        className: (populated as any)?.classId?.name || '',
        sectionName: (populated as any)?.sectionId?.name || '',
        teacherName: displayName((populated as any)?.teacherId?.userId),
      });
    } catch (error) {
      next(error);
    }
  }

  static async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await LiveClassSession.findById(req.params.id);
      if (!session) {
        res.status(404).json({ success: false, message: 'Live class not found' });
        return;
      }

      if (session.status === 'SCHEDULED') {
        session.status = 'LIVE';
        await session.save();
      }

      sendResponse(res, 200, 'Live class ready', {
        id: session._id.toString(),
        meetingLink: session.meetingLink,
        provider: session.provider,
        status: session.status,
      });
    } catch (error) {
      next(error);
    }
  }
}
