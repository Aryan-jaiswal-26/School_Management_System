import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface ITransportTripLog extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  routeId: Types.ObjectId;
  driverUserId?: Types.ObjectId;
  routeNo: string;
  busNo: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'ACTIVE' | 'COMPLETED';
  lastLat?: number;
  lastLng?: number;
  driverAttendance?: 'PRESENT' | 'ABSENT' | 'COMPLETED';
  delayReason?: string;
  delayMinutes?: number;
  maintenanceIssue?: string;
  maintenanceDetails?: string;
  sosTriggeredAt?: Date;
  manifest?: {
    studentId?: Types.ObjectId;
    studentName: string;
    stop?: string;
    boarded: boolean;
    boardedAt?: Date;
    deboarded: boolean;
    deboardedAt?: Date;
  }[];
  events?: {
    kind: 'START' | 'END' | 'BOARD' | 'DEBOARD' | 'DELAY' | 'MAINTENANCE' | 'SOS' | 'ATTENDANCE';
    message: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const transportTripLogSchema = new Schema<ITransportTripLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
    driverUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    routeNo: { type: String, required: true },
    busNo: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
    lastLat: { type: Number },
    lastLng: { type: Number },
    driverAttendance: { type: String, enum: ['PRESENT', 'ABSENT', 'COMPLETED'] },
    delayReason: { type: String },
    delayMinutes: { type: Number },
    maintenanceIssue: { type: String },
    maintenanceDetails: { type: String },
    sosTriggeredAt: { type: Date },
    manifest: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
        studentName: { type: String, required: true },
        stop: { type: String },
        boarded: { type: Boolean, default: false },
        boardedAt: { type: Date },
        deboarded: { type: Boolean, default: false },
        deboardedAt: { type: Date },
      },
    ],
    events: [
      {
        kind: {
          type: String,
          enum: ['START', 'END', 'BOARD', 'DEBOARD', 'DELAY', 'MAINTENANCE', 'SOS', 'ATTENDANCE'],
          required: true,
        },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

transportTripLogSchema.index({ schoolId: 1, routeId: 1, status: 1, startedAt: -1 });

export const TransportTripLog = mongoose.model<ITransportTripLog>('TransportTripLog', transportTripLogSchema);
