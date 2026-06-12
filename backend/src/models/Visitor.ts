import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IVisitorLog extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  purpose: string;
  host: string;
  timeIn: Date;
  timeOut?: Date;
  status: string; // Checked In, Checked Out, Blocked
}

const visitorLogSchema = new Schema<IVisitorLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    host: { type: String, required: true },
    timeIn: { type: Date, required: true, default: Date.now },
    timeOut: { type: Date },
    status: { type: String, required: true, default: 'Checked In' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const VisitorLog = mongoose.model<IVisitorLog>('VisitorLog', visitorLogSchema);

export interface IPreApprovedVisitor extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  relation: string;
  validUntil: Date;
}

const preApprovedVisitorSchema = new Schema<IPreApprovedVisitor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    validUntil: { type: Date, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const PreApprovedVisitor = mongoose.model<IPreApprovedVisitor>('PreApprovedVisitor', preApprovedVisitorSchema);

export interface IBlacklistedVisitor extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  reason: string;
  dateAdded: Date;
}

const blacklistedVisitorSchema = new Schema<IBlacklistedVisitor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    reason: { type: String, required: true },
    dateAdded: { type: Date, required: true, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const BlacklistedVisitor = mongoose.model<IBlacklistedVisitor>('BlacklistedVisitor', blacklistedVisitorSchema);
