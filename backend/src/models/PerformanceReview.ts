import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IPerformanceReview extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  reviewDate: Date;
  academicYearId: Types.ObjectId;
  rating: number; // e.g. 1-5
  feedback: string;
  goals: string[];
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewDate: { type: Date, required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: true },
    goals: [{ type: String }],
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

performanceReviewSchema.index({ schoolId: 1, teacherId: 1 });

export const PerformanceReview = mongoose.model<IPerformanceReview>('PerformanceReview', performanceReviewSchema);
