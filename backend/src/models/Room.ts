import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IRoom extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  hostelId: Types.ObjectId;
  floorId: Types.ObjectId;
  roomNumber: string;
  totalBeds: number;
}

const roomSchema = new Schema<IRoom>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomNumber: { type: String, required: true },
    totalBeds: { type: Number, required: true, default: 0 },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

roomSchema.index({ schoolId: 1, hostelId: 1, floorId: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model<IRoom>('Room', roomSchema);
