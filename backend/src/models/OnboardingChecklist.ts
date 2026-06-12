import mongoose, { Schema, Types, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IOnboardingStep {
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface IOnboardingChecklist extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  steps: IOnboardingStep[];
  completedAt?: Date;
}

const onboardingStepSchema = new Schema<IOnboardingStep>({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  completedBy: { type: String },
  notes: { type: String }
});

const onboardingChecklistSchema = new Schema<IOnboardingChecklist>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], default: 'NOT_STARTED' },
    steps: [onboardingStepSchema],
    completedAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

onboardingChecklistSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

export const OnboardingChecklist = mongoose.model<IOnboardingChecklist>('OnboardingChecklist', onboardingChecklistSchema);
