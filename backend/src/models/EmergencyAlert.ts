import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export type EmergencyCategory =
  | 'SOS'
  | 'BROADCAST'
  | 'FIRE_DRILL'
  | 'LOCKDOWN'
  | 'MISSING_STUDENT'
  | 'BUS_SOS';

export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EmergencyTargetAudience = 'ALL' | 'PARENTS' | 'STUDENTS' | 'TEACHERS' | 'STAFF';
export type EmergencyStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IEmergencyAlert extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  message: string;
  category: EmergencyCategory;
  severity: EmergencySeverity;
  targetAudience: EmergencyTargetAudience;
  sourceRole: string;
  sourceName: string;
  status: EmergencyStatus;
  acknowledgedBy?: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['SOS', 'BROADCAST', 'FIRE_DRILL', 'LOCKDOWN', 'MISSING_STUDENT', 'BUS_SOS'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'PARENTS', 'STUDENTS', 'TEACHERS', 'STAFF'],
      default: 'ALL',
    },
    sourceRole: { type: String, required: true },
    sourceName: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'OPEN',
    },
    acknowledgedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

emergencyAlertSchema.index({ schoolId: 1, createdAt: -1 });
emergencyAlertSchema.index({ schoolId: 1, status: 1 });

export const EmergencyAlert = mongoose.model<IEmergencyAlert>('EmergencyAlert', emergencyAlertSchema);
