import mongoose, { Schema, Types, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IDisciplineRecord extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  incidentDate: Date;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionTaken?: string;
  status: 'PENDING_REVIEW' | 'RESOLVED' | 'APPEALED';
}

const disciplineRecordSchema = new Schema<IDisciplineRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    incidentDate: { type: Date, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    actionTaken: { type: String },
    status: { type: String, enum: ['PENDING_REVIEW', 'RESOLVED', 'APPEALED'], default: 'PENDING_REVIEW' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

disciplineRecordSchema.index({ schoolId: 1, studentId: 1 });

export const DisciplineRecord = mongoose.model<IDisciplineRecord>('DisciplineRecord', disciplineRecordSchema);
