import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const dayOfWeekSchema = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const timetableBreakSchema = z.object({
  breakName: z.string().min(1, 'Break name is required'),
  afterSlot: z.coerce.number().int().positive('After slot must be a positive number'),
  duration: z.coerce.number().int().positive('Break duration is required'),
});

const timetableSlotAssignmentSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  slotNumber: z.coerce.number().int().positive(),
  subjectId: objectIdSchema.optional(),
  teacherId: objectIdSchema.optional(),
  room: z.string().optional(),
});

export const generateTimetableSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  lectureDuration: z.coerce.number().int().positive('Lecture duration is required'),
  totalSlots: z.coerce.number().int().positive('Total slots is required'),
  workingDays: z.array(dayOfWeekSchema).nonempty('Select at least one working day'),
  breaks: z.array(timetableBreakSchema).optional().default([]),
});

export const saveTimetableSchema = z.object({
  classId: objectIdSchema,
  sectionId: objectIdSchema.optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  startTime: z.string().min(1, 'Start time is required'),
  lectureDuration: z.coerce.number().int().positive('Lecture duration is required'),
  totalSlots: z.coerce.number().int().positive('Total slots is required'),
  workingDays: z.array(dayOfWeekSchema).nonempty('Select at least one working day'),
  breaks: z.array(timetableBreakSchema).optional().default([]),
  assignments: z.array(timetableSlotAssignmentSchema).optional().default([]),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  classId: objectIdSchema,
  sectionId: objectIdSchema.optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  startTime: z.string().min(1, 'Start time is required'),
  lectureDuration: z.coerce.number().int().positive('Lecture duration is required'),
  totalSlots: z.coerce.number().int().positive('Total slots is required'),
  workingDays: z.array(dayOfWeekSchema).nonempty('Select at least one working day'),
  breaks: z.array(timetableBreakSchema).optional().default([]),
  slots: z.array(timetableSlotAssignmentSchema).optional().default([]),
});

export const listTemplatesQuerySchema = z.object({
  classId: objectIdSchema.optional(),
});
