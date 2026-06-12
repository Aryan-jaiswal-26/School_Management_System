import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMissingStudentAlert extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  grade: string;
  lastSeenAt: Date;
  lastSeenLocation: string;
  description: string;
  reportedBy: Types.ObjectId;
  status: 'active' | 'resolved' | 'false-alarm';
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  photos: string[];
}

const MissingStudentAlertSchema = new Schema<IMissingStudentAlert>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
  studentName: { type: String, required: true },
  grade: { type: String, required: true },
  lastSeenAt: { type: Date, required: true },
  lastSeenLocation: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['active', 'resolved', 'false-alarm'], default: 'active' },
  resolvedAt: Date,
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
  photos: [{ type: String }],
}, { timestamps: true });

export const MissingStudentAlert = mongoose.model<IMissingStudentAlert>('MissingStudentAlert', MissingStudentAlertSchema);
