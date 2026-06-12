import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IEmployee extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  branchId: Types.ObjectId; // Added for multi-branch support
  userId: Types.ObjectId;
  employeeId: string;
  employeeType: 'TEACHING' | 'NON_TEACHING';
  designation: string;
  qualification?: string;
  joiningDate: Date;
  basicSalary?: number;
  subjects?: Types.ObjectId[];
  department?: string;
  profilePhoto?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  dateOfBirth?: Date;
  mobileNumber?: string;
  alternateMobileNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bloodGroup?: string;
  employeeIdAuto?: boolean;
  experience?: number;
  aadhaarNumber?: string;
  panNumber?: string;
  resumeUrl?: string;
  employmentStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  employmentType?: 'PERMANENT' | 'TEMPORARY' | 'CONTRACT_BASIS' | 'VISITING_FACULTY' | 'PART_TIME' | 'FULL_TIME';
  workingStartDate?: Date;
  workingEndDate?: Date;
  contractDuration?: string;
  shiftTiming?: string;
  classAssignment?: Types.ObjectId[];
  sectionAssignment?: Types.ObjectId[];
  streamAssignment?: string[];
  isClassTeacher?: boolean;
  bio?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, trim: true },
    employeeType: { type: String, enum: ['TEACHING', 'NON_TEACHING'], required: true },
    designation: { type: String, required: true },
    qualification: { type: String },
    joiningDate: { type: Date, required: true },
    basicSalary: { type: Number },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    department: { type: String },
    profilePhoto: { type: String },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
    dateOfBirth: { type: Date },
    mobileNumber: { type: String },
    alternateMobileNumber: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    bloodGroup: { type: String },
    employeeIdAuto: { type: Boolean, default: false },
    experience: { type: Number },
    aadhaarNumber: { type: String },
    panNumber: { type: String },
    resumeUrl: { type: String },
    employmentStatus: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'RESIGNED'], default: 'ACTIVE' },
    employmentType: { type: String, enum: ['PERMANENT', 'TEMPORARY', 'CONTRACT_BASIS', 'VISITING_FACULTY', 'PART_TIME', 'FULL_TIME'] },
    workingStartDate: { type: Date },
    workingEndDate: { type: Date },
    contractDuration: { type: String },
    shiftTiming: { type: String },
    classAssignment: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    sectionAssignment: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    streamAssignment: [{ type: String }],
    isClassTeacher: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

employeeSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ schoolId: 1, userId: 1 }, { unique: true });
employeeSchema.index({ schoolId: 1, department: 1 });
employeeSchema.index({ schoolId: 1, employeeType: 1 });
employeeSchema.index({ schoolId: 1, branchId: 1, employeeType: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
