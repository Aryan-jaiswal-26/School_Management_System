import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelMessage extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  senderId: Types.ObjectId;
  hostelId: Types.ObjectId;
  targetAudience: 'STUDENTS' | 'PARENTS' | 'ALL';
  type: 'General' | 'Information' | 'Warning' | 'Emergency';
  title: string;
  content: string;
}

const hostelMessageSchema = new Schema<IHostelMessage>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    targetAudience: { type: String, enum: ['STUDENTS', 'PARENTS', 'ALL'], default: 'ALL', required: true },
    type: { type: String, enum: ['General', 'Information', 'Warning', 'Emergency'], default: 'General', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

export const HostelMessage = mongoose.model<IHostelMessage>('HostelMessage', hostelMessageSchema);
