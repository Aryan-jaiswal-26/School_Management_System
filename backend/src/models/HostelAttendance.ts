import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHostelAttendance extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  date: Date;
  session: 'morning' | 'evening' | 'night';
  presentIds: Types.ObjectId[];
  absentIds: Types.ObjectId[];
  wardenId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const hostelAttendanceSchema = new Schema<IHostelAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    date: { type: Date, required: true },
    session: { 
      type: String, 
      enum: ['morning', 'evening', 'night'], 
      required: true 
    },
    presentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    absentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    wardenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

hostelAttendanceSchema.index({ schoolId: 1, date: 1, session: 1 }, { unique: true });

export const HostelAttendance = mongoose.model<IHostelAttendance>('HostelAttendance', hostelAttendanceSchema);
