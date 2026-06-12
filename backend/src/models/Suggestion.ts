import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISuggestion extends Document {
  schoolId: Types.ObjectId;
  content: string;
  category: 'academic' | 'facility' | 'safety' | 'food' | 'transport' | 'other';
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  adminNotes?: string;
  submittedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>(
  {
    schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
    content: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ['academic', 'facility', 'safety', 'food', 'transport', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
      default: 'pending',
    },
    adminNotes: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

SuggestionSchema.index({ schoolId: 1, status: 1, submittedAt: -1 });
SuggestionSchema.index({ schoolId: 1, category: 1 });

export const Suggestion = mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
