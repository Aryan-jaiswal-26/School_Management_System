import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IVote extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  electionId: Types.ObjectId;
  studentId: Types.ObjectId;
  candidateId: Types.ObjectId;
}

const voteSchema = new Schema<IVote>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

voteSchema.index({ electionId: 1, studentId: 1 }, { unique: true }); // A student can only vote once per election

export const Vote = mongoose.model<IVote>('Vote', voteSchema);
