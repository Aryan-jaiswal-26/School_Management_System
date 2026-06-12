import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IResult extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    grade: { type: String },
    remarks: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// One result per student per subject per exam
resultSchema.index({ schoolId: 1, examId: 1, studentId: 1, subjectId: 1 }, { unique: true });
resultSchema.index({ schoolId: 1, studentId: 1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);
