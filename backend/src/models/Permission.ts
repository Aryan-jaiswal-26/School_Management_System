import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IPermission extends Document, IAuditFields {
  name: string; // e.g., 'CREATE_STUDENT', 'VIEW_REPORTS'
  module: string; // e.g., 'STUDENT', 'ATTENDANCE', 'FINANCE'
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true, uppercase: true, trim: true },
    module: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

permissionSchema.index({ name: 1 }, { unique: true });
permissionSchema.index({ module: 1 });

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
