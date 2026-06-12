import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ILibraryBook extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelf?: string;
}

const libraryBookSchema = new Schema<ILibraryBook>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    category: { type: String, required: true },
    totalCopies: { type: Number, default: 1, required: true },
    availableCopies: { type: Number, default: 1, required: true },
    shelf: { type: String },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

libraryBookSchema.index({ schoolId: 1, isbn: 1 }, { unique: true, sparse: true });
libraryBookSchema.index({ schoolId: 1, title: 1, author: 1 });

export const LibraryBook = mongoose.model<ILibraryBook>('LibraryBook', libraryBookSchema);
