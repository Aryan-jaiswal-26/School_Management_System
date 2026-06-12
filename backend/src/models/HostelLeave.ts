import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelLeave extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  outTime: Date;
  expectedInTime: Date;
  actualInTime?: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  wardenId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const hostelLeaveSchema = new Schema<IHostelLeave>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    outTime: { type: Date, required: true },
    expectedInTime: { type: Date, required: true },
    actualInTime: { type: Date },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'completed'], 
      default: 'pending', 
      required: true 
    },
    wardenId: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelLeaveSchema.index({ schoolId: 1, studentId: 1 });
hostelLeaveSchema.index({ schoolId: 1, status: 1 });

export const HostelLeave = mongoose.model<IHostelLeave>('HostelLeave', hostelLeaveSchema);
