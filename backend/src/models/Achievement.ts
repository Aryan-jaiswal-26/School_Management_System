import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IAchievement extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentName: string;
  title: string;
  category: 'Sports' | 'Extracurricular';
  date: string;
  position?: string;
  description?: string;
}

const achievementSchema = new Schema<IAchievement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Sports', 'Extracurricular'], required: true },
    date: { type: String, required: true },
    position: { type: String, trim: true },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

achievementSchema.index({ schoolId: 1, category: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
