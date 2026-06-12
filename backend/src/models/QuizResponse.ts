import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IQuizResponse extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  quizId: Types.ObjectId;
  studentId: Types.ObjectId;
  selectedOptionIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizResponseSchema = new Schema<IQuizResponse>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    selectedOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

quizResponseSchema.index({ schoolId: 1, quizId: 1, studentId: 1 }, { unique: true });
quizResponseSchema.index({ schoolId: 1, studentId: 1 });

export const QuizResponse = mongoose.model<IQuizResponse>('QuizResponse', quizResponseSchema);
