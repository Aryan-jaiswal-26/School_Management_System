import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISemester extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  name: string; // e.g., 'Fall 2023', 'Term 1'
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const semesterSchema = new Schema<ISemester>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Indexes
semesterSchema.index({ academicYearId: 1, name: 1 }, { unique: true });
semesterSchema.index({ schoolId: 1 });

export const Semester = mongoose.model<ISemester>('Semester', semesterSchema);
