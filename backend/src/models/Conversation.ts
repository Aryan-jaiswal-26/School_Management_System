import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IConversation extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  type: 'DIRECT' | 'GROUP' | 'PARENT_TEACHER';
  title?: string;
  participants: Types.ObjectId[];
  createdBy: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    type: { type: String, enum: ['DIRECT', 'GROUP', 'PARENT_TEACHER'], default: 'DIRECT', required: true },
    title: { type: String, trim: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

conversationSchema.index({ schoolId: 1, participants: 1 });
conversationSchema.index({ schoolId: 1, type: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
