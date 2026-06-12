import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IStudent extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  branchId: Types.ObjectId; // Added for multi-branch support
  userId: Types.ObjectId; // Link to user for auth/profile
  admissionNumber: string;
  rollNumber?: string;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  parentIds: Types.ObjectId[];
  dob: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  tcStatus: 'NONE' | 'REQUESTED' | 'ISSUED';
  tcIssueDate?: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  votedFor?: Types.ObjectId; // Link to candidate (another student)
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admissionNumber: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    parentIds: [{ type: Schema.Types.ObjectId, ref: 'Parent' }],
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    bloodGroup: { type: String },
    address: { type: String },
    photoUrl: { type: String },
    emergencyContact: { type: String },
    tcStatus: { type: String, enum: ['NONE', 'REQUESTED', 'ISSUED'], default: 'NONE' },
    tcIssueDate: { type: Date },
    isActive: { type: Boolean, default: true },
    votedFor: { type: Schema.Types.ObjectId, ref: 'Student' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Tenant-isolated unique admission number
studentSchema.index({ schoolId: 1, branchId: 1, admissionNumber: 1 });
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, branchId: 1, classId: 1, sectionId: 1 });
studentSchema.index({ schoolId: 1, classId: 1, sectionId: 1 });
studentSchema.index({ schoolId: 1, userId: 1 }, { unique: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
