import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILessonPlan extends Document {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  weekStartDate: Date;
  title: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  homework?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  adminFeedback?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}

const LessonPlanSchema = new Schema<ILessonPlan>(
  {
    schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
    teacherId: { type: Schema.Types.ObjectId, required: true, ref: 'Employee' },
    classId: { type: Schema.Types.ObjectId, required: true, ref: 'Class' },
    subjectId: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
    weekStartDate: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    objectives: [{ type: String }],
    activities: [{ type: String }],
    materials: [{ type: String }],
    homework: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    adminFeedback: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

LessonPlanSchema.index({ schoolId: 1, teacherId: 1, weekStartDate: -1 });
LessonPlanSchema.index({ schoolId: 1, classId: 1, status: 1 });

export const LessonPlan = mongoose.model<ILessonPlan>('LessonPlan', LessonPlanSchema);
