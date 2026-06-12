import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvoice extends Document {
  schoolId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  paymentGatewayRef?: string;
  billingDetails: {
    schoolName: string;
    address?: string;
    email?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING',
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    paymentMethod: { type: String },
    paymentGatewayRef: { type: String },
    billingDetails: {
      schoolName: { type: String, required: true },
      address: { type: String },
      email: { type: String },
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ schoolId: 1 });
invoiceSchema.index({ status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
