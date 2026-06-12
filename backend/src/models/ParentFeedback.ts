import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface IParentFeedback extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  parentId: Types.ObjectId;
  userId: Types.ObjectId;
  target: string;
  rating: number;
  feedback: string;
  anonymous: boolean;
  category: 'EVENT' | 'SCHOOL' | 'TRANSPORT' | 'FEES' | 'GENERAL';
  createdAt: Date;
  updatedAt: Date;
}

const parentFeedbackSchema = new Schema<IParentFeedback>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, required: true, trim: true },
    anonymous: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['EVENT', 'SCHOOL', 'TRANSPORT', 'FEES', 'GENERAL'],
      default: 'GENERAL',
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

parentFeedbackSchema.index({ schoolId: 1, createdAt: -1 });

export const ParentFeedback = mongoose.model<IParentFeedback>('ParentFeedback', parentFeedbackSchema);
