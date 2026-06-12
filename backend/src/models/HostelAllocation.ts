import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelAllocation extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  hostelId: Types.ObjectId;
  floorId: Types.ObjectId;
  roomId: Types.ObjectId;
  bedId: Types.ObjectId;
  checkInDate: Date;
  checkOutDate?: Date;
  status: 'Active' | 'Vacated' | 'Transferred';
}

const hostelAllocationSchema = new Schema<IHostelAllocation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    checkInDate: { type: Date, default: Date.now, required: true },
    checkOutDate: { type: Date },
    status: { type: String, enum: ['Active', 'Vacated', 'Transferred'], default: 'Active', required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelAllocationSchema.index({ schoolId: 1, studentId: 1, status: 1 });

export const HostelAllocation = mongoose.model<IHostelAllocation>('HostelAllocation', hostelAllocationSchema);
