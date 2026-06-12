import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IHomework extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  maxScore?: number;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const homeworkSchema = new Schema<IHomework>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    attachments: [{ type: String }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

homeworkSchema.index({ schoolId: 1, classId: 1, sectionId: 1, dueDate: 1 });
homeworkSchema.index({ schoolId: 1, teacherId: 1 });

export const Homework = mongoose.model<IHomework>('Homework', homeworkSchema);
