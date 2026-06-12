import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IParent extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  occupation?: string;
  contactPrimary: string;
  contactSecondary?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const parentSchema = new Schema<IParent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    occupation: { type: String },
    contactPrimary: { type: String, required: true },
    contactSecondary: { type: String },
    address: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

parentSchema.index({ schoolId: 1, userId: 1 }, { unique: true });
parentSchema.index({ schoolId: 1, contactPrimary: 1 });

export const Parent = mongoose.model<IParent>('Parent', parentSchema);
