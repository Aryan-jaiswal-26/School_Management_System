import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAnnouncement extends Document, IAuditFields {
  schoolId?: Types.ObjectId;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'SCHOOL_ADMINS';
  targetClassId?: Types.ObjectId; // Only if target is specific class
  publishedDate: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    targetAudience: { 
      type: String, 
      enum: ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'SCHOOL_ADMINS'], 
      default: 'ALL' 
    },
    targetClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
    publishedDate: { type: Date, default: Date.now },
    attachments: [{ type: String }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

announcementSchema.index({ schoolId: 1, publishedDate: -1 });
announcementSchema.index({ schoolId: 1, targetAudience: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
