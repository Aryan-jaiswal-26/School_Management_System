import { Request, Response } from 'express';
import { Timetable } from '../models/Timetable.js';
import { TimetableTemplate } from '../models/TimetableTemplate.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';
import {
  createTemplateSchema,
  generateTimetableSchema,
  saveTimetableSchema,
} from '../validations/timetable.validation.js';

type BreakConfig = { breakName: string; afterSlot: number; duration: number };
type GeneratedSlot = {
  id: string;
  dayOfWeek: string;
  type: 'lecture' | 'break';
  slotNumber?: number;
  breakName?: string;
  startTime: string;
  endTime: string;
};

function parseTimeToMinutes(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ampm = match[3]?.toUpperCase();
  if (ampm) {
    if (hours === 12) {
      hours = ampm === 'AM' ? 0 : 12;
    } else if (ampm === 'PM') {
      hours += 12;
    }
  }
  return hours * 60 + minutes;
}

function formatMinutesToTime(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function buildSchedule(
  startTime: string,
  lectureDuration: number,
  totalSlots: number,
  breaks: BreakConfig[]
) {
  const minutes = parseTimeToMinutes(startTime);
  const activeBreaks = breaks
    .filter(b => b.breakName && b.duration > 0 && b.afterSlot >= 1 && b.afterSlot <= totalSlots)
    .sort((a, b) => a.afterSlot - b.afterSlot);

  const schedule: Omit<GeneratedSlot, 'dayOfWeek'>[] = [];
  let currentTime = minutes;

  for (let slotNumber = 1; slotNumber <= totalSlots; slotNumber += 1) {
    const slotStart = currentTime;
    const slotEnd = slotStart + lectureDuration;
    schedule.push({
      id: `lecture-${slotNumber}`,
      type: 'lecture',
      slotNumber,
      startTime: formatMinutesToTime(slotStart),
      endTime: formatMinutesToTime(slotEnd),
    });
    currentTime = slotEnd;

    const matchingBreaks = activeBreaks.filter(b => b.afterSlot === slotNumber);
    matchingBreaks.forEach(b => {
      const breakStart = currentTime;
      const breakEnd = breakStart + b.duration;
      schedule.push({
        id: `break-${slotNumber}-${b.breakName}`,
        type: 'break',
        breakName: b.breakName,
        startTime: formatMinutesToTime(breakStart),
        endTime: formatMinutesToTime(breakEnd),
      });
      currentTime = breakEnd;
    });
  }

  return schedule;
}

export async function createTimetableEntry(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const entry = new Timetable({
      schoolId: new Types.ObjectId(schoolId as string),
      classId: new Types.ObjectId(req.body.classId),
      sectionId: req.body.sectionId ? new Types.ObjectId(req.body.sectionId) : undefined,
      subjectId: new Types.ObjectId(req.body.subjectId),
      teacherId: req.body.teacherId ? new Types.ObjectId(req.body.teacherId) : undefined,
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      room: req.body.room,
    });

    await entry.save();
    return sendResponse(res, 201, 'Timetable entry created', entry);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to create timetable entry', { error: error.message });
  }
}

export async function getTimetable(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = {
      schoolId: new Types.ObjectId(schoolId as string),
      isDeleted: false,
    };

    if (req.query.classId && Types.ObjectId.isValid(String(req.query.classId))) {
      query.classId = new Types.ObjectId(String(req.query.classId));
    }

    if (req.query.sectionId && Types.ObjectId.isValid(String(req.query.sectionId))) {
      query.sectionId = new Types.ObjectId(String(req.query.sectionId));
    }

    const entries = await Timetable.find(query)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code')
      .populate({ path: 'teacherId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ dayOfWeek: 1, startTime: 1 });

    return sendResponse(res, 200, 'Timetable retrieved', entries);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to retrieve timetable', { error: error.message });
  }
}

export async function generateTimetable(req: Request, res: Response) {
  try {
    const validated = generateTimetableSchema.parse(req.body);
    const baseSchedule = buildSchedule(
      validated.startTime,
      validated.lectureDuration,
      validated.totalSlots,
      validated.breaks || []
    );

    const schedule: GeneratedSlot[] = validated.workingDays.flatMap(day =>
      baseSchedule.map(slot => ({ ...slot, dayOfWeek: day }))
    );

    return sendResponse(res, 200, 'Timetable generated', schedule);
  } catch (error: any) {
    return sendResponse(res, 400, error?.message || 'Invalid timetable configuration', null);
  }
}

export async function saveGeneratedTimetable(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const validated = saveTimetableSchema.parse(req.body);
    const baseSchedule = buildSchedule(
      validated.startTime,
      validated.lectureDuration,
      validated.totalSlots,
      validated.breaks || []
    );

    const assignmentsByDaySlot = new Map<string, { subjectId?: string; teacherId?: string; room?: string }>();
    validated.assignments.forEach(item => {
      assignmentsByDaySlot.set(`${item.dayOfWeek}-${item.slotNumber}`, item);
    });

    // Soft-delete existing timetable entries for this class/section
    const deleteQuery: any = {
      schoolId: new Types.ObjectId(schoolId as string),
      classId: new Types.ObjectId(validated.classId),
      isDeleted: false,
    };
    if (validated.sectionId) {
      deleteQuery.sectionId = new Types.ObjectId(validated.sectionId);
    } else {
      deleteQuery.sectionId = null;
    }
    await Timetable.updateMany(deleteQuery, { $set: { isDeleted: true, deletedAt: new Date() } });

    const entries = [];

    for (const dayOfWeek of validated.workingDays) {
      for (const item of baseSchedule) {
        if (item.type !== 'lecture') continue;
        const assignment = assignmentsByDaySlot.get(`${dayOfWeek}-${item.slotNumber ?? 0}`);
        if (!assignment?.subjectId) {
          return sendResponse(
            res,
            400,
            `Subject is required for slot ${item.slotNumber} on ${dayOfWeek}`,
            null
          );
        }

        entries.push({
          schoolId: new Types.ObjectId(schoolId as string),
          classId: new Types.ObjectId(validated.classId),
          sectionId: validated.sectionId ? new Types.ObjectId(validated.sectionId) : undefined,
          subjectId: new Types.ObjectId(assignment.subjectId),
          teacherId: assignment.teacherId ? new Types.ObjectId(assignment.teacherId) : undefined,
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          room: assignment.room,
        });
      }
    }

    const createdEntries = await Timetable.insertMany(entries);
    return sendResponse(res, 201, 'Timetable saved', createdEntries);
  } catch (error: any) {
    return sendResponse(res, 400, error?.message || 'Failed to save timetable', null);
  }
}

export async function createTimetableTemplate(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const validated = createTemplateSchema.parse(req.body);
    const template = new TimetableTemplate({
      schoolId: new Types.ObjectId(schoolId as string),
      name: validated.name,
      classId: new Types.ObjectId(validated.classId),
      sectionId: validated.sectionId ? new Types.ObjectId(validated.sectionId) : undefined,
      academicYear: validated.academicYear,
      startTime: validated.startTime,
      lectureDuration: validated.lectureDuration,
      totalSlots: validated.totalSlots,
      workingDays: validated.workingDays,
      breaks: validated.breaks || [],
      slots: validated.slots.map(slot => ({
        slotNumber: slot.slotNumber,
        subjectId: slot.subjectId ? new Types.ObjectId(slot.subjectId) : undefined,
        teacherId: slot.teacherId ? new Types.ObjectId(slot.teacherId) : undefined,
        room: slot.room,
      })),
    });

    await template.save();
    return sendResponse(res, 201, 'Template saved', template);
  } catch (error: any) {
    return sendResponse(res, 400, error?.message || 'Failed to save template', null);
  }
}

export async function listTimetableTemplates(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query = { schoolId: new Types.ObjectId(schoolId as string) } as any;
    if (req.query.classId && Types.ObjectId.isValid(String(req.query.classId))) {
      query.classId = new Types.ObjectId(String(req.query.classId));
    }

    const templates = await TimetableTemplate.find(query)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, 'Templates retrieved', templates);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list templates', { error: error.message });
  }
}

export async function getTimetableByClassId(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const classId = req.params.classId;
    if (!Types.ObjectId.isValid(classId)) return sendResponse(res, 400, 'Invalid class id', null);

    const query: any = {
      schoolId: new Types.ObjectId(schoolId as string),
      classId: new Types.ObjectId(classId),
      isDeleted: false,
    };
    if (req.query.sectionId) query.sectionId = new Types.ObjectId(req.query.sectionId as string);

    const entries = await Timetable.find(query)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code')
      .populate({ path: 'teacherId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ dayOfWeek: 1, startTime: 1 });

    return sendResponse(res, 200, 'Timetable retrieved', entries);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to retrieve timetable by class', { error: error.message });
  }
}

export async function updateTimetableEntry(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const entry = await Timetable.findOneAndUpdate(
      { _id: new Types.ObjectId(req.params.id), schoolId: new Types.ObjectId(schoolId as string), isDeleted: false },
      { $set: req.body },
      { new: true }
    );

    if (!entry) return sendResponse(res, 404, 'Entry not found', null);
    return sendResponse(res, 200, 'Entry updated', entry);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to update entry', { error: error.message });
  }
}

export async function deleteTimetableEntry(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const entry = await Timetable.findOneAndUpdate(
      { _id: new Types.ObjectId(req.params.id), schoolId: new Types.ObjectId(schoolId as string) },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!entry) return sendResponse(res, 404, 'Entry not found', null);
    return sendResponse(res, 200, 'Entry deleted', entry);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to delete entry', { error: error.message });
  }
}
