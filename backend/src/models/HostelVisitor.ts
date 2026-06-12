import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelVisitor extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  visitorName: string;
  studentName: string;
  room: string;
  purpose: string;
  checkIn: Date;
  checkOut?: Date;
  status: 'checked-in' | 'checked-out' | 'pending';
}

const hostelVisitorSchema = new Schema<IHostelVisitor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    visitorName: { type: String, required: true },
    studentName: { type: String, required: true },
    room: { type: String, required: true },
    purpose: { type: String, required: true },
    checkIn: { type: Date, default: Date.now, required: true },
    checkOut: { type: Date },
    status: { 
      type: String, 
      enum: ['checked-in', 'checked-out', 'pending'], 
      default: 'checked-in', 
      required: true 
    },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

export const HostelVisitor = mongoose.model<IHostelVisitor>('HostelVisitor', hostelVisitorSchema);
