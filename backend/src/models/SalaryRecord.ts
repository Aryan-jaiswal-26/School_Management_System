import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface ISalaryRecord extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  employeeId: Types.ObjectId;
  month: number; // 1-12
  year: number;
  basicPay: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PAID';
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salaryRecordSchema = new Schema<ISalaryRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    basicPay: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    paidAt: { type: Date },
    paymentMethod: { type: String },
    transactionId: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

salaryRecordSchema.index({ schoolId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

export const SalaryRecord = mongoose.model<ISalaryRecord>('SalaryRecord', salaryRecordSchema);
