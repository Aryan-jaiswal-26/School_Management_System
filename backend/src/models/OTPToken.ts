import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOTPToken extends Document {
  phone?: string;
  email?: string;
  schoolId?: Types.ObjectId;
  otp: string;
  expiresAt: Date;
  used: boolean;
  purpose: 'login' | 'verify-phone' | 'verify-email' | 'reset-password';
}

const OTPTokenSchema = new Schema<IOTPToken>({
  phone: { type: String },
  email: { type: String },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  purpose: { type: String, enum: ['login', 'verify-phone', 'verify-email', 'reset-password'], default: 'login' },
}, { timestamps: true });

// TTL index: automatically delete expired tokens after 15 minutes
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPToken = mongoose.model<IOTPToken>('OTPToken', OTPTokenSchema);
