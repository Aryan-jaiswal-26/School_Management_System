import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IBookCirculation extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  bookTitle: string;
  studentId: Types.ObjectId;
  studentName: string;
  issuedDate: Date;
  dueDate: Date;
  returnedDate?: Date;
  status: 'issued' | 'returned' | 'overdue';
  finePerDay?: number;
}

const bookCirculationSchema = new Schema<IBookCirculation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
    bookTitle: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    issuedDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date, required: true },
    returnedDate: { type: Date },
    status: { type: String, enum: ['issued', 'returned', 'overdue'], default: 'issued', required: true },
    finePerDay: { type: Number, default: 0 },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

bookCirculationSchema.index({ schoolId: 1, studentId: 1 });
bookCirculationSchema.index({ schoolId: 1, bookId: 1 });

export const BookCirculation = mongoose.model<IBookCirculation>('BookCirculation', bookCirculationSchema);
