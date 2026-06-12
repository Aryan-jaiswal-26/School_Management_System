import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelFeePlan extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  hostelId: Types.ObjectId;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  amount: number;
  lateFee: number;
}

const hostelFeePlanSchema = new Schema<IHostelFeePlan>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], required: true },
    amount: { type: Number, required: true },
    lateFee: { type: Number, default: 0 },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

export const HostelFeePlan = mongoose.model<IHostelFeePlan>('HostelFeePlan', hostelFeePlanSchema);
