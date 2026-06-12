import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ICMSPage extends Document, IAuditFields {
  title: string;
  slug: string;
  type: 'TERMS' | 'PRIVACY' | 'FAQ' | 'HELP_CENTER';
  content: string;
  isPublished: boolean;
  category?: string; // e.g. for FAQs: 'Billing', 'Account'
  version: number;
}

const cmsPageSchema = new Schema<ICMSPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ['TERMS', 'PRIVACY', 'FAQ', 'HELP_CENTER'],
      required: true,
    },
    content: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    category: { type: String, trim: true },
    version: { type: Number, default: 1 },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

cmsPageSchema.index({ type: 1 });
cmsPageSchema.index({ slug: 1 });

export const CMSPage = mongoose.model<ICMSPage>('CMSPage', cmsPageSchema);
