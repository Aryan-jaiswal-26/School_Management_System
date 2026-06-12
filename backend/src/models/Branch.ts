import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IBranch extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    address: { type: String },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Indexes
branchSchema.index({ schoolId: 1, code: 1 }, { unique: true });
branchSchema.index({ schoolId: 1, name: 1 });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
