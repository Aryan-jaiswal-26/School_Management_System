import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IBadge extends Document, IAuditFields {
  name: string;
  icon: string;
  desc: string;
  tone: string;
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
    desc: { type: String, required: true },
    tone: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
