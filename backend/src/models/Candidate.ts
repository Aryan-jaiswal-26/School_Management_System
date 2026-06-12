import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ICandidate extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  electionId: Types.ObjectId;
  name: string;
  grade: string;
  position: string;
  votes: number;
  avatar: string;
}

const candidateSchema = new Schema<ICandidate>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
    name: { type: String, required: true },
    grade: { type: String, required: true },
    position: { type: String, required: true },
    votes: { type: Number, default: 0 },
    avatar: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

candidateSchema.index({ electionId: 1 });

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);
