import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface IStudentLeaveRequest extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  parentId: Types.ObjectId;
  studentId: Types.ObjectId;
  leaveType: 'PERSONAL' | 'MEDICAL' | 'FAMILY' | 'TRAVEL' | 'OTHER';
  startDate: Date;
  endDate: Date;
  reason: string;
  attachmentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: Types.ObjectId;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentLeaveRequestSchema = new Schema<IStudentLeaveRequest>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    leaveType: { type: String, enum: ['PERSONAL', 'MEDICAL', 'FAMILY', 'TRAVEL', 'OTHER'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    attachmentUrl: { type: String, trim: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String, trim: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

studentLeaveRequestSchema.index({ schoolId: 1, studentId: 1, status: 1 });
studentLeaveRequestSchema.index({ schoolId: 1, parentId: 1, createdAt: -1 });

export const StudentLeaveRequest = mongoose.model<IStudentLeaveRequest>('StudentLeaveRequest', studentLeaveRequestSchema);
