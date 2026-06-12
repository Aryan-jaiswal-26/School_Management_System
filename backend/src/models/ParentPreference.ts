import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface IParentPreference extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  parentId: Types.ObjectId;
  userId: Types.ObjectId;
  busAlerts: boolean;
  examGrades: boolean;
  feeReminders: boolean;
  attendance: boolean;
  newsletters: boolean;
  preferredLanguages: string[];
  channels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const parentPreferenceSchema = new Schema<IParentPreference>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    busAlerts: { type: Boolean, default: true },
    examGrades: { type: Boolean, default: true },
    feeReminders: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    newsletters: { type: Boolean, default: false },
    preferredLanguages: { type: [String], default: ['en'] },
    channels: { type: [String], default: ['push', 'email'] },
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

parentPreferenceSchema.index({ schoolId: 1, parentId: 1 }, { unique: true });

export const ParentPreference = mongoose.model<IParentPreference>('ParentPreference', parentPreferenceSchema);
