import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface ISportsTeam extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  coach: string;
  members: number;
  nextMatch?: string;
  status: 'Active' | 'Training' | 'Inactive';
}

const sportsTeamSchema = new Schema<ISportsTeam>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    coach: { type: String, required: true },
    members: { type: Number, default: 0 },
    nextMatch: { type: String },
    status: { type: String, enum: ['Active', 'Training', 'Inactive'], default: 'Active' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

sportsTeamSchema.index({ schoolId: 1, name: 1 });

export const SportsTeam = mongoose.model<ISportsTeam>('SportsTeam', sportsTeamSchema);
