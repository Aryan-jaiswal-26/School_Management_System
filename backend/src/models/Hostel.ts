import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostel extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  hostelName: string;
  hostelType: 'Boys' | 'Girls';
  buildingName: string;
  wardenName?: string;
  wardenContact?: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

const hostelSchema = new Schema<IHostel>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    hostelName: { type: String, required: true },
    hostelType: { type: String, enum: ['Boys', 'Girls'], required: true },
    buildingName: { type: String, required: true },
    wardenName: { type: String },
    wardenContact: { type: String },
    description: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelSchema.index({ schoolId: 1, hostelName: 1 }, { unique: true });

export const Hostel = mongoose.model<IHostel>('Hostel', hostelSchema);
