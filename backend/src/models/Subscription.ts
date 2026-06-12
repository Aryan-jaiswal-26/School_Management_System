import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  schoolId: Types.ObjectId;
  planId: Types.ObjectId;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING';
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  paymentGatewayRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'TRIALING'],
      default: 'TRIALING',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    trialEndsAt: { type: Date },
    paymentGatewayRef: { type: String, trim: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ schoolId: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
