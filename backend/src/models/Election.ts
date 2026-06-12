import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IElection extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  positions: string[];
}

const electionSchema = new Schema<IElection>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
    positions: { type: [String], required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

electionSchema.index({ schoolId: 1, status: 1 });

export const Election = mongoose.model<IElection>('Election', electionSchema);
