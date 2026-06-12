import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IExam extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string; // e.g., 'Midterm 2026', 'Finals'
  classId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  subject?: string;
  grade?: string;
  room?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED';
  gradingScheme?: {
    aThreshold: number;
    bThreshold: number;
    cThreshold: number;
    dThreshold: number;
    passMark: number;
  };
  publishedAt?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    subject: { type: String },
    grade: { type: String },
    room: { type: String },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'PUBLISHED'], default: 'UPCOMING' },
    gradingScheme: {
      type: {
        aThreshold: { type: Number, default: 90 },
        bThreshold: { type: Number, default: 80 },
        cThreshold: { type: Number, default: 70 },
        dThreshold: { type: Number, default: 60 },
        passMark: { type: Number, default: 40 },
      },
      default: undefined,
    },
    publishedAt: { type: Date },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

examSchema.index({ schoolId: 1, classId: 1, name: 1 }, { unique: true });
examSchema.index({ schoolId: 1, startDate: 1 });

export const Exam = mongoose.model<IExam>('Exam', examSchema);
