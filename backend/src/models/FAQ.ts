import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IFAQ extends Document, IAuditFields {
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

faqSchema.index({ category: 1 });
faqSchema.index({ isActive: 1 });
faqSchema.index({ order: 1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);
