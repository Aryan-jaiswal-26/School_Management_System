import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IFeeScholarship extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  type: 'CONCESSION' | 'SCHOLARSHIP';
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

const feeScholarshipSchema = new Schema<IFeeScholarship>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    feeId: { type: Schema.Types.ObjectId, ref: 'Fee', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    type: { type: String, enum: ['CONCESSION', 'SCHOLARSHIP'], required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

feeScholarshipSchema.index({ schoolId: 1, feeId: 1, status: 1 });

export const FeeScholarship = mongoose.model<IFeeScholarship>('FeeScholarship', feeScholarshipSchema);
