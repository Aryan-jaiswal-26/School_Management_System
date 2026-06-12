import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IExtracurricularActivity extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  instructor: string;
  enrolled: number;
  max: number;
}

const extracurricularActivitySchema = new Schema<IExtracurricularActivity>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    instructor: { type: String, required: true },
    enrolled: { type: Number, default: 0 },
    max: { type: Number, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

extracurricularActivitySchema.index({ schoolId: 1, name: 1 });

export const ExtracurricularActivity = mongoose.model<IExtracurricularActivity>('ExtracurricularActivity', extracurricularActivitySchema);
