import mongoose, { Schema, Document, Types } from 'mongoose';
import { IBaseDocument } from './common.js';

export interface ISyllabus extends IBaseDocument {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  unitName: string;
  topics: string[];
  completed: boolean;
}

const syllabusSchema = new Schema<ISyllabus>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  unitName: { type: String, required: true },
  topics: [{ type: String }],
  completed: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export const Syllabus = mongoose.model<ISyllabus>('Syllabus', syllabusSchema);
