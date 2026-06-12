import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISubstituteAssignment extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  absentTeacherId: Types.ObjectId;
  substituteTeacherId: Types.ObjectId;
  date: Date;
  periodOrTime: string;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const substituteAssignmentSchema = new Schema<ISubstituteAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    absentTeacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    substituteTeacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    periodOrTime: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    notes: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

substituteAssignmentSchema.index({ schoolId: 1, date: 1 });

export const SubstituteAssignment = mongoose.model<ISubstituteAssignment>('SubstituteAssignment', substituteAssignmentSchema);
