import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAcademicYear extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string; // e.g., '2023-2024'
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Indexes
academicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
academicYearSchema.index({ schoolId: 1, isCurrent: 1 });

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', academicYearSchema);
