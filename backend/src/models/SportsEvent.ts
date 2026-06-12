import mongoose, { Schema, Types } from 'mongoose';
import type { Document } from 'mongoose';
import type { IAuditFields } from './common.js';
import { auditSchemaDefinition } from './common.js';

export interface ISportsEvent extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  name: string;
  eventType: 'Sports Day' | 'Annual Day' | 'Other';
  startDate: string;
  endDate: string;
  organizer: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

const sportsEventSchema = new Schema<ISportsEvent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true, trim: true },
    eventType: { type: String, enum: ['Sports Day', 'Annual Day', 'Other'], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    organizer: { type: String, required: true },
    status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

sportsEventSchema.index({ schoolId: 1, startDate: 1 });

export const SportsEvent = mongoose.model<ISportsEvent>('SportsEvent', sportsEventSchema);
