import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPTM extends Document {
  schoolId: Types.ObjectId;
  title: string;
  date: Date;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "15:00"
  slotDurationMinutes: number; // e.g. 15
  teacherId: Types.ObjectId;
  classId?: Types.ObjectId;
  slots: Array<{
    _id: Types.ObjectId;
    time: string;
    studentId?: Types.ObjectId;
    parentId?: Types.ObjectId;
    status: 'AVAILABLE' | 'BOOKED' | 'CANCELLED';
    meetingLink?: string;
    room?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ptmSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, required: true, default: 15 },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    slots: [
      {
        time: { type: String, required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
        parentId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['AVAILABLE', 'BOOKED', 'CANCELLED'], default: 'AVAILABLE' },
        meetingLink: String,
        room: String,
      }
    ]
  },
  { timestamps: true }
);

export const PTM = mongoose.model<IPTM>('PTM', ptmSchema);
