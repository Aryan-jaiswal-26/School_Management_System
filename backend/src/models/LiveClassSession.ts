import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export type LiveClassProvider = 'GOOGLE_MEET' | 'ZOOM' | 'OTHER';
export type LiveClassStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface ILiveClassSession extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  subject: string;
  teacherId: Types.ObjectId;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  provider: LiveClassProvider;
  meetingLink: string;
  meetingCode?: string;
  description?: string;
  recordingUrl?: string;
  studyMaterialLinks: string[];
  status: LiveClassStatus;
  attendees?: { studentId: Types.ObjectId; joinedAt: Date }[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const liveClassSessionSchema = new Schema<ILiveClassSession>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 45 },
    provider: { type: String, enum: ['GOOGLE_MEET', 'ZOOM', 'OTHER'], default: 'GOOGLE_MEET' },
    meetingLink: { type: String, required: true },
    meetingCode: { type: String },
    description: { type: String },
    recordingUrl: { type: String },
    studyMaterialLinks: [{ type: String }],
    status: { type: String, enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'], default: 'SCHEDULED' },
    attendees: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

liveClassSessionSchema.index({ schoolId: 1, scheduledAt: -1 });
liveClassSessionSchema.index({ schoolId: 1, teacherId: 1, status: 1 });
liveClassSessionSchema.index({ schoolId: 1, classId: 1, sectionId: 1, status: 1 });

export const LiveClassSession = mongoose.model<ILiveClassSession>('LiveClassSession', liveClassSessionSchema);
