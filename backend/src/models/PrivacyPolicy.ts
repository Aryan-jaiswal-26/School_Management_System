import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IPrivacyPolicy extends Document, IAuditFields {
  version: string;
  content: string;
  publishedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const privacyPolicySchema = new Schema<IPrivacyPolicy>(
  {
    version: { type: String, required: true, trim: true, unique: true },
    content: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

privacyPolicySchema.index({ isActive: 1 });

export const PrivacyPolicy = mongoose.model<IPrivacyPolicy>('PrivacyPolicy', privacyPolicySchema);
