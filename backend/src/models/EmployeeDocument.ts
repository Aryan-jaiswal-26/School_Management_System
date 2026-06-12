import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IEmployeeDocument extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  employeeId: Types.ObjectId;
  documentType: 'RESUME' | 'ID_PROOF' | 'CONTRACT' | 'OTHER';
  fileUrl: string;
  originalName: string;
  uploadedAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    documentType: { 
      type: String, 
      enum: ['RESUME', 'ID_PROOF', 'CONTRACT', 'OTHER'], 
      required: true 
    },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ schoolId: 1, employeeId: 1 });

export const EmployeeDocument = mongoose.model<IEmployeeDocument>('EmployeeDocument', employeeDocumentSchema);
