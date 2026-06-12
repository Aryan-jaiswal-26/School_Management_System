import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IEvent extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  date: Date;
  type: string;
  rsvpCount: number;
  tickets: string;
  isPaid: boolean;
  ticketPrice?: number;
  volunteers: string[];
  gallery: string[];
}

const eventSchema = new Schema<IEvent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, required: true },
    rsvpCount: { type: Number, required: true, default: 0 },
    tickets: { type: String, required: true, default: 'Free' },
    isPaid: { type: Boolean, default: false },
    ticketPrice: { type: Number },
    volunteers: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', eventSchema);
