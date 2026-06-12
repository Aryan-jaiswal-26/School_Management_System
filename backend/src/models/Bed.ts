import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IBed extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  hostelId: Types.ObjectId;
  floorId: Types.ObjectId;
  roomId: Types.ObjectId;
  bedNumber: number;
  status: 'Available' | 'Occupied';
  assignedStudent?: Types.ObjectId;
}

const bedSchema = new Schema<IBed>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedNumber: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Occupied'], default: 'Available', required: true },
    assignedStudent: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

bedSchema.index({ schoolId: 1, roomId: 1, bedNumber: 1 }, { unique: true });

export const Bed = mongoose.model<IBed>('Bed', bedSchema);
