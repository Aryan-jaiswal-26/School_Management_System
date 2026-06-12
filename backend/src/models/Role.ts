import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IRole extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string; // e.g., 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'
  description?: string;
  permissions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Compound index to ensure role names are unique per school
roleSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', roleSchema);
