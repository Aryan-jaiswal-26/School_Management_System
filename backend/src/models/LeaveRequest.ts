import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface ILeaveRequest extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  employeeId: Types.ObjectId;
  leaveType: 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY' | 'OTHER';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: String, enum: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'OTHER'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

leaveRequestSchema.index({ schoolId: 1, employeeId: 1 });
leaveRequestSchema.index({ schoolId: 1, status: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
