import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICertificate extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  type: 'performance' | 'participation' | 'achievement' | 'cocurricular' | 'honor' | 'completion';
  title: string;
  description: string;
  issuedDate: Date;
  issuedBy: Types.ObjectId;
  eventId?: Types.ObjectId;
  examId?: Types.ObjectId;
  grade?: string;
  position?: string;
  pdfUrl?: string;
  certificateNumber: string;
  isActive: boolean;
}

const CertificateSchema = new Schema<ICertificate>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
  studentName: { type: String, required: true },
  type: { type: String, enum: ['performance', 'participation', 'achievement', 'cocurricular', 'honor', 'completion'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  issuedDate: { type: Date, default: Date.now },
  issuedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
  grade: String,
  position: String,
  pdfUrl: String,
  certificateNumber: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);
