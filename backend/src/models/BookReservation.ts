import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IBookReservation extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  userId: Types.ObjectId; // student or parent
  status: 'pending' | 'fulfilled' | 'cancelled';
  notified: boolean;
  reservationDate: Date;
  expiryDate?: Date; // How long to hold the book once available
}

const bookReservationSchema = new Schema<IBookReservation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'fulfilled', 'cancelled'], default: 'pending' },
    notified: { type: Boolean, default: false },
    reservationDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

bookReservationSchema.index({ schoolId: 1, bookId: 1, status: 1 });
bookReservationSchema.index({ schoolId: 1, userId: 1 });

export const BookReservation = mongoose.model<IBookReservation>('BookReservation', bookReservationSchema);
