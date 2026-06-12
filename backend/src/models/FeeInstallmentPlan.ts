import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IFeeInstallmentPlan extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  totalAmount: number;
  installmentCount: number;
  amountPerInstallment: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  dueDates: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    status: 'PENDING' | 'PAID';
  }>;
  notes?: string;
}

const feeInstallmentPlanSchema = new Schema<IFeeInstallmentPlan>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    feeId: { type: Schema.Types.ObjectId, ref: 'Fee', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    installmentCount: { type: Number, required: true, min: 1 },
    amountPerInstallment: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
    dueDates: [
      {
        installmentNumber: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
      },
    ],
    notes: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

feeInstallmentPlanSchema.index({ schoolId: 1, studentId: 1, feeId: 1 });

export const FeeInstallmentPlan = mongoose.model<IFeeInstallmentPlan>(
  'FeeInstallmentPlan',
  feeInstallmentPlanSchema
);
