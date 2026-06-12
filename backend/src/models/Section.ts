import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISection extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  branchId: Types.ObjectId; // Added for multi-branch support
  classId: Types.ObjectId;
  name: string; // e.g., 'A', 'B', 'Science'
  classTeacherId?: Types.ObjectId;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true, trim: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    capacity: { type: Number },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

sectionSchema.index({ schoolId: 1, classId: 1, name: 1 }, { unique: true });
sectionSchema.index({ schoolId: 1, branchId: 1, classId: 1, name: 1 });
sectionSchema.index({ schoolId: 1, classTeacherId: 1 });

export const Section = mongoose.model<ISection>('Section', sectionSchema);
