import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface INewsletter extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  content: string; // HTML/Markdown
  coverImageUrl?: string;
  volume?: string;
  issue?: string;
  publishedDate?: Date;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  targetAudience: ('STUDENT' | 'PARENT' | 'TEACHER' | 'ALL')[];
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String },
    volume: { type: String },
    issue: { type: String },
    publishedDate: { type: Date },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
    targetAudience: [{ type: String, enum: ['STUDENT', 'PARENT', 'TEACHER', 'ALL'] }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

newsletterSchema.index({ schoolId: 1, status: 1 });

export const Newsletter = mongoose.model<INewsletter>('Newsletter', newsletterSchema);
