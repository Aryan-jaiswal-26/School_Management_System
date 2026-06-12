import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IEBook extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  category: string;
  subject?: string;
  fileUrl: string;
  fileType: string;
  accessLevel: 'all' | 'specific_classes';
  targetClasses?: Types.ObjectId[]; // if accessLevel is specific_classes
}

const eBookSchema = new Schema<IEBook>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    subject: { type: String },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    accessLevel: { type: String, enum: ['all', 'specific_classes'], default: 'all' },
    targetClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    ...auditSchemaDefinition
  },
  { timestamps: true }
);

eBookSchema.index({ schoolId: 1, title: 1 });
eBookSchema.index({ schoolId: 1, category: 1 });

export const EBook = mongoose.model<IEBook>('EBook', eBookSchema);
