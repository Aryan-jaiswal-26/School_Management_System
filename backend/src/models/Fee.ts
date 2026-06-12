import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IFee extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  branchId?: Types.ObjectId;
  studentId: Types.ObjectId;
  feeType: string;
  amount: number;
  paidAmount: number;
  discountAmount: number;
  discountReason?: string;
  dueDate: Date;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    feeType: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountReason: { type: String },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'], default: 'PENDING' },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

feeSchema.index({ schoolId: 1, studentId: 1 });
feeSchema.index({ schoolId: 1, status: 1 });
feeSchema.index({ schoolId: 1, dueDate: 1 });
feeSchema.index({ schoolId: 1, branchId: 1, status: 1 });

export const Fee = mongoose.model<IFee>('Fee', feeSchema);
