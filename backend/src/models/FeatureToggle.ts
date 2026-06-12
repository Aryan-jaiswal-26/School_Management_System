import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IFeatureToggle extends Document, IAuditFields {
  moduleName: string;
  description: string;
  isEnabledGlobally: boolean;
  excludedSchools: Types.ObjectId[]; // Schools that have this disabled even if enabled globally
  minimumPlan?: Types.ObjectId; // E.g., requires 'PRO' plan
  createdAt: Date;
  updatedAt: Date;
}

const featureToggleSchema = new Schema<IFeatureToggle>(
  {
    moduleName: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    isEnabledGlobally: { type: Boolean, default: true },
    excludedSchools: [{ type: Schema.Types.ObjectId, ref: 'School' }],
    minimumPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const FeatureToggle = mongoose.model<IFeatureToggle>('FeatureToggle', featureToggleSchema);
