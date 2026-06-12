import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ITermsCondition extends Document, IAuditFields {
  version: string;
  content: string;
  publishedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const termsConditionSchema = new Schema<ITermsCondition>(
  {
    version: { type: String, required: true, trim: true, unique: true },
    content: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

termsConditionSchema.index({ isActive: 1 });

export const TermsCondition = mongoose.model<ITermsCondition>('TermsCondition', termsConditionSchema);
