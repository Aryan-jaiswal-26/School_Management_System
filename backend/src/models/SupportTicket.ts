import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISupportTicket extends Document, IAuditFields {
  schoolId?: Types.ObjectId; // Optional: Can be raised by a non-school user, or for global platform support
  userId: Types.ObjectId; // The user who raised it
  subject: string;
  description: string;
  category: 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'ACCOUNT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  comments: Array<{
    userId: Types.ObjectId;
    message: string;
    createdAt: Date;
  }>;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'ACCOUNT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ schoolId: 1 });
supportTicketSchema.index({ userId: 1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
