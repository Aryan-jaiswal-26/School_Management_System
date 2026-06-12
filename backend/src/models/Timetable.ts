import mongoose, { Schema, Document, Types } from 'mongoose';
import { IBaseDocument } from './common.js';

export interface ITimetable extends IBaseDocument {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId?: Types.ObjectId;
  dayOfWeek: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  room: string;
}

const timetableSchema = new Schema<ITimetable>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
