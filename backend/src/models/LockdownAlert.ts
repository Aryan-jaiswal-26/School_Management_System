import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILockdownAlert extends Document {
  schoolId: Types.ObjectId;
  issuedBy: Types.ObjectId;
  reason: string;
  level: 'precautionary' | 'full' | 'shelter-in-place';
  instructions: string;
  affectedAreas: string[];
  status: 'active' | 'lifted' | 'false-alarm';
  liftedAt?: Date;
  liftedBy?: Types.ObjectId;
  notifiedParents: boolean;
  notifiedStaff: boolean;
}

const LockdownAlertSchema = new Schema<ILockdownAlert>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  issuedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  reason: { type: String, required: true },
  level: { type: String, enum: ['precautionary', 'full', 'shelter-in-place'], required: true },
  instructions: { type: String, required: true },
  affectedAreas: [{ type: String }],
  status: { type: String, enum: ['active', 'lifted', 'false-alarm'], default: 'active' },
  liftedAt: Date,
  liftedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notifiedParents: { type: Boolean, default: false },
  notifiedStaff: { type: Boolean, default: false },
}, { timestamps: true });

export const LockdownAlert = mongoose.model<ILockdownAlert>('LockdownAlert', LockdownAlertSchema);
