import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGatePass extends Document {
  schoolId: Types.ObjectId;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  validFrom: Date;
  validUntil: Date;
  qrCode: string;
  otpCode: string;
  isUsed: boolean;
  usedAt?: Date;
  createdBy: Types.ObjectId;
}

const GatePassSchema = new Schema<IGatePass>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  visitorName: { type: String, required: true },
  visitorPhone: { type: String, required: true },
  purpose: { type: String, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  qrCode: { type: String, required: true },
  otpCode: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  usedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

export const GatePass = mongoose.model<IGatePass>('GatePass', GatePassSchema);
