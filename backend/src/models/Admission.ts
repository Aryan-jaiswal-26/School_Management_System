import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAdmissionDocument {
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface IAdmissionApplication extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  userId?: Types.ObjectId; // Parent who applied
  studentName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: Date;
  gender: string;
  email: string;
  phone: string;
  currentSchool?: string;
  currentGrade?: string;
  applyingForGrade: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  applicationStatus: string; // Draft, Submitted, Under Review, Approved, Rejected, Waitlisted
  appliedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  documents: IAdmissionDocument[];
  admissionFeeStatus: string; // Pending, Paid
  admissionFeeAmount: number;
  notes?: string;
  parentEmail: string;
  parentPhone: string;
}

const documentSchema = new Schema<IAdmissionDocument>({
  documentType: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, required: true, default: Date.now },
  verificationStatus: { type: String, required: true, default: 'Pending' },
  verifiedBy: { type: String },
  verifiedAt: { type: Date }
});

const admissionApplicationSchema = new Schema<IAdmissionApplication>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    currentSchool: { type: String },
    currentGrade: { type: String },
    applyingForGrade: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    applicationStatus: { type: String, required: true, default: 'Submitted' },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    documents: [documentSchema],
    admissionFeeStatus: { type: String, required: true, default: 'Pending' },
    admissionFeeAmount: { type: Number, required: true, default: 5000 },
    notes: { type: String },
    parentEmail: { type: String, required: true },
    parentPhone: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const AdmissionApplication = mongoose.model<IAdmissionApplication>('AdmissionApplication', admissionApplicationSchema);
