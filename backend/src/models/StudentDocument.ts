import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IStudentDocument extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  documentType: 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'PHOTO' | 'ID_PROOF' | 'OTHER';
  fileUrl: string;
  originalName: string;
  uploadedAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentDocumentSchema = new Schema<IStudentDocument>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    documentType: { 
      type: String, 
      enum: ['BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'PHOTO', 'ID_PROOF', 'OTHER'], 
      required: true 
    },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

studentDocumentSchema.index({ schoolId: 1, studentId: 1 });

export const StudentDocument = mongoose.model<IStudentDocument>('StudentDocument', studentDocumentSchema);
