import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IFloor extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  hostelId: Types.ObjectId;
  floorNumber: number;
}

const floorSchema = new Schema<IFloor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    floorNumber: { type: Number, required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

floorSchema.index({ schoolId: 1, hostelId: 1, floorNumber: 1 }, { unique: true });

export const Floor = mongoose.model<IFloor>('Floor', floorSchema);
