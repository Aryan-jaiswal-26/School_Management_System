import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface ITournament extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  date: string;
  location: string;
  teams: number;
  isInterSchool: boolean;
  participatingSchools: string[];
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

const tournamentSchema = new Schema<ITournament>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    teams: { type: Number, default: 0 },
    isInterSchool: { type: Boolean, default: false },
    participatingSchools: { type: [String], default: [] },
    status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

tournamentSchema.index({ schoolId: 1 });

export const Tournament = mongoose.model<ITournament>('Tournament', tournamentSchema);
