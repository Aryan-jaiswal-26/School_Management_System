import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelFeeInvoice extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  feePlanId: Types.ObjectId;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentHistory: Array<{
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    transactionId?: string;
  }>;
}

const hostelFeeInvoiceSchema = new Schema<IHostelFeeInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    feePlanId: { type: Schema.Types.ObjectId, ref: 'HostelFeePlan', required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], default: 'PENDING', required: true },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now, required: true },
        paymentMethod: { type: String, required: true },
        transactionId: { type: String }
      }
    ],
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

export const HostelFeeInvoice = mongoose.model<IHostelFeeInvoice>('HostelFeeInvoice', hostelFeeInvoiceSchema);
