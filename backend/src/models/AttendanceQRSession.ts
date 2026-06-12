import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendanceQRSession extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  teacherId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  date: Date;
  period: string;
  qrToken: string;
  expiresAt: Date;
  scannedStudents: Types.ObjectId[];
  isActive: boolean;
}

const AttendanceQRSessionSchema = new Schema<IAttendanceQRSession>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  classId: { type: Schema.Types.ObjectId, required: true, ref: 'Class' },
  teacherId: { type: Schema.Types.ObjectId, required: true, ref: 'Employee' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  date: { type: Date, required: true },
  period: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  scannedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const AttendanceQRSession = mongoose.model<IAttendanceQRSession>('AttendanceQRSession', AttendanceQRSessionSchema);
