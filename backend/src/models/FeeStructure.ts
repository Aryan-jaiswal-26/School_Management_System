import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface IFeeStructure extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  feeType: string; // e.g., 'TUITION', 'TRANSPORT', 'LIBRARY'
  amount: number;
  dueDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    feeType: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

feeStructureSchema.index({ schoolId: 1, classId: 1, academicYearId: 1, feeType: 1 }, { unique: true });

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', feeStructureSchema);
