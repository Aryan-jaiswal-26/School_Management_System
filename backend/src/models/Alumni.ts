import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAlumni extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId; // Original student record
  graduationYear: number;
  currentOccupation?: string;
  companyOrUniversity?: string;
  linkedInProfile?: string;
  email?: string;
  phone?: string;
  address?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alumniSchema = new Schema<IAlumni>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    graduationYear: { type: Number, required: true },
    currentOccupation: { type: String },
    companyOrUniversity: { type: String },
    linkedInProfile: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

alumniSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });
alumniSchema.index({ schoolId: 1, graduationYear: 1 });

export const Alumni = mongoose.model<IAlumni>('Alumni', alumniSchema);
