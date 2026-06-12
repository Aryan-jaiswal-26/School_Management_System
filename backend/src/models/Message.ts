import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IMessage extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  attachments?: string[];
  replyTo?: Types.ObjectId;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ schoolId: 1, senderId: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
