import mongoose, { Schema, Types, Document } from 'mongoose';
import { auditSchemaDefinition, IAuditFields } from './common.js';

export interface IParentCommunityPost extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  parentId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  category: 'GENERAL' | 'EVENT' | 'ACADEMIC' | 'TRANSPORT' | 'FEES' | 'OTHER';
  anonymous: boolean;
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const parentCommunityPostSchema = new Schema<IParentCommunityPost>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['GENERAL', 'EVENT', 'ACADEMIC', 'TRANSPORT', 'FEES', 'OTHER'],
      default: 'GENERAL',
    },
    anonymous: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    ...auditSchemaDefinition,
  },
  { timestamps: true },
);

parentCommunityPostSchema.index({ schoolId: 1, createdAt: -1 });
parentCommunityPostSchema.index({ schoolId: 1, parentId: 1, createdAt: -1 });

export const ParentCommunityPost = mongoose.model<IParentCommunityPost>('ParentCommunityPost', parentCommunityPostSchema);
