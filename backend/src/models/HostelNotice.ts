import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelNotice extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  content: string;
  authorId: Types.ObjectId;
  target: 'ALL' | 'ROOM' | 'BLOCK';
  targetId?: string; // e.g., '101' for room or 'A' for block
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const hostelNoticeSchema = new Schema<IHostelNotice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    target: { 
      type: String, 
      enum: ['ALL', 'ROOM', 'BLOCK'], 
      default: 'ALL',
      required: true 
    },
    targetId: { type: String },
    attachments: [{ type: String }],
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelNoticeSchema.index({ schoolId: 1, createdAt: -1 });

export const HostelNotice = mongoose.model<IHostelNotice>('HostelNotice', hostelNoticeSchema);
