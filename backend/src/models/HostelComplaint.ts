import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelComplaint extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId?: Types.ObjectId;
  studentName: string;
  room: string;
  category: 'plumbing' | 'electrical' | 'maintenance' | 'cleaning' | 'security' | 'other';
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'emergency';
  reportedBy?: Types.ObjectId;
}

const hostelComplaintSchema = new Schema<IHostelComplaint>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    room: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['plumbing', 'electrical', 'maintenance', 'cleaning', 'security', 'other'], 
      required: true 
    },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['open', 'in-progress', 'resolved', 'emergency'], 
      default: 'open', 
      required: true 
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

export const HostelComplaint = mongoose.model<IHostelComplaint>('HostelComplaint', hostelComplaintSchema);
