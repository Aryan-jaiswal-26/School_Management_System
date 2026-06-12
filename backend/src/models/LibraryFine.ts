import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ILibraryFine extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  circulationId?: Types.ObjectId;
  amount: number;
  reason: 'late' | 'lost' | 'damaged' | 'other';
  status: 'paid' | 'unpaid' | 'waived';
  paymentDate?: Date;
  remarks?: string;
}

const libraryFineSchema = new Schema<ILibraryFine>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    circulationId: { type: Schema.Types.ObjectId, ref: 'BookCirculation' },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, enum: ['late', 'lost', 'damaged', 'other'], required: true },
    status: { type: String, enum: ['paid', 'unpaid', 'waived'], default: 'unpaid' },
    paymentDate: { type: Date },
    remarks: { type: String },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

libraryFineSchema.index({ schoolId: 1, studentId: 1 });
libraryFineSchema.index({ schoolId: 1, circulationId: 1 });
libraryFineSchema.index({ schoolId: 1, status: 1 });

export const LibraryFine = mongoose.model<ILibraryFine>('LibraryFine', libraryFineSchema);
