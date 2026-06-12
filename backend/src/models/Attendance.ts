import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAttendance extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  branchId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXEMPTION';
  remarks?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXEMPTION'], required: true },
    remarks: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// One attendance record per student per day
attendanceSchema.index({ schoolId: 1, branchId: 1, studentId: 1, date: 1 }, { unique: true });
// For querying attendance by section and date
attendanceSchema.index({ schoolId: 1, branchId: 1, classId: 1, sectionId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
