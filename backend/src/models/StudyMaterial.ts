import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IStudyMaterial extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  category: 'NOTES' | 'SYLLABUS' | 'REFERENCE' | 'VIDEO';
  uploadedAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    category: { type: String, enum: ['NOTES', 'SYLLABUS', 'REFERENCE', 'VIDEO'], default: 'NOTES' },
    uploadedAt: { type: Date, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

studyMaterialSchema.index({ schoolId: 1, classId: 1, subjectId: 1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>('StudyMaterial', studyMaterialSchema);
