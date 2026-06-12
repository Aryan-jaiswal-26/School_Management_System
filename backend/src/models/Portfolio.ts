import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPortfolioEntry {
  _id?: Types.ObjectId;
  type: 'assignment' | 'project' | 'certificate' | 'artwork' | 'achievement' | 'other';
  title: string;
  description?: string;
  fileUrl?: string;
  subject?: string;
  grade?: string;
  date: Date;
}

export interface IPortfolio extends Document {
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  entries: IPortfolioEntry[];
  bio?: string;
  goals?: string;
  interests?: string[];
  isPublic: boolean;
}

const PortfolioEntrySchema = new Schema<IPortfolioEntry>(
  {
    type: {
      type: String,
      enum: ['assignment', 'project', 'certificate', 'artwork', 'achievement', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    fileUrl: { type: String },
    subject: { type: String },
    grade: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: true },
);

const PortfolioSchema = new Schema<IPortfolio>(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student', unique: true },
    schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
    entries: [PortfolioEntrySchema],
    bio: { type: String },
    goals: { type: String },
    interests: [{ type: String }],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PortfolioSchema.index({ studentId: 1 }, { unique: true });
PortfolioSchema.index({ schoolId: 1, studentId: 1 });

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
