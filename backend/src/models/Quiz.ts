import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IQuiz extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  question: string;
  options: string[];
  correctOptionIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v.length === 4;
        },
        message: 'A quiz must have exactly 4 options.'
      }
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

quizSchema.index({ schoolId: 1, classId: 1, isActive: 1 });
quizSchema.index({ schoolId: 1, teacherId: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
