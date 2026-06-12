import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IEmployeeAttendance extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY' | 'LATE';
  checkInTime?: Date;
  checkOutTime?: Date;
  remarks?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeAttendanceSchema = new Schema<IEmployeeAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY', 'LATE'], required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    remarks: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

employeeAttendanceSchema.index({ schoolId: 1, employeeId: 1, date: 1 }, { unique: true });
employeeAttendanceSchema.index({ schoolId: 1, date: 1 });

export const EmployeeAttendance = mongoose.model<IEmployeeAttendance>('EmployeeAttendance', employeeAttendanceSchema);
