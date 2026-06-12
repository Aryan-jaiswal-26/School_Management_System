import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISubject extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  type: 'CORE' | 'ELECTIVE' | 'LAB';
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String },
    type: { type: String, enum: ['CORE', 'ELECTIVE', 'LAB'], default: 'CORE' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

subjectSchema.index({ schoolId: 1, classId: 1, code: 1 });
subjectSchema.index({ schoolId: 1, classId: 1 });
subjectSchema.index({ schoolId: 1, name: 1 });

// Ensure proper indexes on model initialization
subjectSchema.statics.ensureIndexes = async function() {
  try {
    // Drop old unique index that allows duplicates across classes
    const indexInfo = await this.collection.getIndexes();
    for (const [indexName, indexSpec] of Object.entries(indexInfo)) {
      if (indexName === 'schoolId_1_code_1' || (indexSpec as any).name === 'schoolId_1_code_1') {
        await this.collection.dropIndex(indexName);
        console.log('Dropped old schoolId_1_code_1 index');
      }
    }
  } catch (err) {
    // Index doesn't exist or error occurred, that's fine
  }
};

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
