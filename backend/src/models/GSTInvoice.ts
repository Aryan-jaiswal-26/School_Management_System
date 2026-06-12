import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGSTLineItem {
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface IGSTInvoice extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  studentName: string;
  studentGrade: string;
  parentName: string;
  parentGSTIN?: string;
  parentAddress: string;
  schoolGSTIN: string;
  schoolAddress: string;
  lineItems: IGSTLineItem[];
  subTotal: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  grandTotal: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  pdfUrl?: string;
  paymentId?: Types.ObjectId;
}

const GSTLineItemSchema = new Schema<IGSTLineItem>({
  description: String,
  hsn: String,
  quantity: Number,
  rate: Number,
  taxableAmount: Number,
  cgstRate: Number,
  cgstAmount: Number,
  sgstRate: Number,
  sgstAmount: Number,
  igstRate: Number,
  igstAmount: Number,
  totalAmount: Number,
}, { _id: false });

const GSTInvoiceSchema = new Schema<IGSTInvoice>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  studentName: String,
  studentGrade: String,
  parentName: String,
  parentGSTIN: String,
  parentAddress: String,
  schoolGSTIN: { type: String, required: true },
  schoolAddress: { type: String, required: true },
  lineItems: [GSTLineItemSchema],
  subTotal: Number,
  totalCGST: Number,
  totalSGST: Number,
  totalIGST: Number,
  roundOff: { type: Number, default: 0 },
  grandTotal: Number,
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'draft',
  },
  pdfUrl: String,
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

export const GSTInvoice = mongoose.model<IGSTInvoice>('GSTInvoice', GSTInvoiceSchema);
