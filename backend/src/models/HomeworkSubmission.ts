import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IHomeworkSubmission extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  homeworkId: Types.ObjectId;
  studentId: Types.ObjectId;
  submittedAt: Date;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'REVIEWED';
  fileUrl?: string;
  fileName?: string;
  remarks?: string;
  marks?: number;
}

const homeworkSubmissionSchema = new Schema<IHomeworkSubmission>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    homeworkId: { type: Schema.Types.ObjectId, ref: 'Homework', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['PENDING', 'SUBMITTED', 'LATE', 'REVIEWED'], default: 'SUBMITTED' },
    fileUrl: { type: String },
    fileName: { type: String },
    remarks: { type: String },
    marks: { type: Number, min: 0 },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

homeworkSubmissionSchema.index({ schoolId: 1, homeworkId: 1, studentId: 1 }, { unique: true });

export const HomeworkSubmission = mongoose.model<IHomeworkSubmission>('HomeworkSubmission', homeworkSubmissionSchema);
