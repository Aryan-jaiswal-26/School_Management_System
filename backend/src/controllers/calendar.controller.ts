import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Event } from '../models/Event.js';
import { Exam } from '../models/Exam.js';
import { PTM } from '../models/PTM.js';
import { sendResponse } from '../utils/response.js';

type CalendarItemType = 'event' | 'exam' | 'ptm';

interface CalendarItem {
  type: CalendarItemType;
  date: Date;
  endDate?: Date;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export class CalendarController {
  static async getCalendar(req: Request, res: Response): Promise<void> {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      sendResponse(res, 400, 'Missing school context', null);
      return;
    }

    const now = new Date();
    const monthParam = parseInt((req.query.month as string) || String(now.getMonth() + 1), 10);
    const yearParam = parseInt((req.query.year as string) || String(now.getFullYear()), 10);

    if (monthParam < 1 || monthParam > 12) {
      sendResponse(res, 400, 'month must be between 1 and 12', null);
      return;
    }

    const startDate = new Date(yearParam, monthParam - 1, 1, 0, 0, 0);
    const endDate = new Date(yearParam, monthParam, 0, 23, 59, 59);

    const sId = new Types.ObjectId(schoolId);

    const [events, exams, ptms] = await Promise.all([
      Event.find({
        schoolId: sId,
        date: { $gte: startDate, $lte: endDate },
      })
        .select('title date type rsvpCount')
        .lean(),

      Exam.find({
        schoolId: sId,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      })
        .select('name startDate endDate subject grade status description')
        .lean(),

      PTM.find({
        schoolId: sId,
        date: { $gte: startDate, $lte: endDate },
      })
        .select('title date startTime endTime teacherId')
        .populate('teacherId', 'fullName')
        .lean(),
    ]);

    const calendarItems: CalendarItem[] = [];

    // Map events
    for (const ev of events) {
      calendarItems.push({
        type: 'event',
        date: ev.date,
        title: ev.title,
        description: `${ev.type} event`,
        metadata: {
          id: (ev._id as Types.ObjectId).toString(),
          eventType: ev.type,
          rsvpCount: ev.rsvpCount,
        },
      });
    }

    // Map exams
    for (const exam of exams) {
      calendarItems.push({
        type: 'exam',
        date: exam.startDate,
        endDate: exam.endDate,
        title: exam.name,
        description: exam.description ?? `${exam.subject ?? 'General'} exam`,
        metadata: {
          id: (exam._id as Types.ObjectId).toString(),
          subject: exam.subject,
          grade: exam.grade,
          status: exam.status,
          endDate: exam.endDate,
        },
      });
    }

    // Map PTMs
    for (const ptm of ptms) {
      calendarItems.push({
        type: 'ptm',
        date: ptm.date,
        title: ptm.title,
        description: `Parent-Teacher Meeting from ${ptm.startTime} to ${ptm.endTime}`,
        metadata: {
          id: (ptm._id as Types.ObjectId).toString(),
          startTime: ptm.startTime,
          endTime: ptm.endTime,
          teacher: (ptm.teacherId as any)?.fullName ?? ptm.teacherId,
        },
      });
    }

    // Sort by date ascending
    calendarItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sendResponse(res, 200, 'Calendar events retrieved', {
      month: monthParam,
      year: yearParam,
      startDate,
      endDate,
      total: calendarItems.length,
      items: calendarItems,
    });
  }
}
