import mongoose, { Schema, Types } from 'mongoose';
import { IBaseDocument } from './common.js';

export interface ITimetableTemplate extends IBaseDocument {
  schoolId: Types.ObjectId;
  name: string;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  academicYear: string;
  startTime: string;
  lectureDuration: number;
  totalSlots: number;
  workingDays: string[];
  breaks: Array<{ breakName: string; afterSlot: number; duration: number }>;
  slots: Array<{ slotNumber: number; subjectId?: Types.ObjectId; teacherId?: Types.ObjectId; room?: string }>;
}

const breakSchema = new Schema({
  breakName: { type: String, required: true },
  afterSlot: { type: Number, required: true },
  duration: { type: Number, required: true },
}, { _id: false });

const slotSchema = new Schema({
  slotNumber: { type: Number, required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  room: { type: String },
}, { _id: false });

const timetableTemplateSchema = new Schema<ITimetableTemplate>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
  academicYear: { type: String, required: true },
  startTime: { type: String, required: true },
  lectureDuration: { type: Number, required: true },
  totalSlots: { type: Number, required: true },
  workingDays: { type: [String], required: true },
  breaks: { type: [breakSchema], default: [] },
  slots: { type: [slotSchema], default: [] },
}, { timestamps: true });

export const TimetableTemplate = mongoose.model<ITimetableTemplate>('TimetableTemplate', timetableTemplateSchema);
