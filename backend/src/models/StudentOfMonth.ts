import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudentOfMonth extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  grade: string;
  month: number; // 1-12
  year: number;
  category: 'academic' | 'sports' | 'arts' | 'leadership' | 'kindness' | 'overall';
  reason: string;
  nominatedBy: Types.ObjectId;
  photoUrl?: string;
  points: number;
}

const StudentOfMonthSchema = new Schema<IStudentOfMonth>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
  studentName: { type: String, required: true },
  grade: { type: String, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  category: {
    type: String,
    enum: ['academic', 'sports', 'arts', 'leadership', 'kindness', 'overall'],
    default: 'overall',
  },
  reason: { type: String, required: true },
  nominatedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  photoUrl: String,
  points: { type: Number, default: 0 },
}, { timestamps: true });

export const StudentOfMonth = mongoose.model<IStudentOfMonth>('StudentOfMonth', StudentOfMonthSchema);
