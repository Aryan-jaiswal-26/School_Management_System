import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelRoom extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  block: string;
  roomNo: string;
  capacity: number;
  occupied: number;
  studentIds: Types.ObjectId[];
  status: 'available' | 'full' | 'maintenance';
}

const hostelRoomSchema = new Schema<IHostelRoom>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    block: { type: String, required: true },
    roomNo: { type: String, required: true },
    capacity: { type: Number, default: 4, required: true },
    occupied: { type: Number, default: 0, required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['available', 'full', 'maintenance'], default: 'available', required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelRoomSchema.index({ schoolId: 1, block: 1, roomNo: 1 }, { unique: true });

export const HostelRoom = mongoose.model<IHostelRoom>('HostelRoom', hostelRoomSchema);
