import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  code: 'FREE_TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'; 
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[]; // e.g. ['LMS', 'TRANSPORT', 'HOSTEL', 'CHAT']
  limits: {
    maxStudents: number;
    maxTeachers: number;
    maxStorageBytes: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, enum: ['FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY'], required: true },
    features: [{ type: String }],
    limits: {
      maxStudents: { type: Number, default: 200 },
      maxTeachers: { type: Number, default: 20 },
      maxStorageBytes: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5GB
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1 });

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
