import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface INotification extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string; // e.g., 'FEE_REMINDER', 'NEW_HOMEWORK', 'ATTENDANCE_UPDATE'
  channels: string[];
  status: 'QUEUED' | 'SENT' | 'FAILED';
  isRead: boolean;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    channels: { type: [String], default: ['PUSH'] },
    status: { type: String, enum: ['QUEUED', 'SENT', 'FAILED'], default: 'QUEUED' },
    isRead: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String },
    link: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

notificationSchema.index({ schoolId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ schoolId: 1, userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
