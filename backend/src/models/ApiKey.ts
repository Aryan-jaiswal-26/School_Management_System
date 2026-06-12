import mongoose, { Schema, Types, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IApiKey extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  keyHash: string;
  prefix: string; // The first few characters of the key for display purposes
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    lastUsedAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

apiKeySchema.index({ schoolId: 1, isActive: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
