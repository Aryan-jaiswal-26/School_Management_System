import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  schoolId?: Types.ObjectId;
  userId: Types.ObjectId;
  activityType: 'LOGIN' | 'LOGOUT' | 'PAGE_VIEW' | 'SEARCH';
  details?: Schema.Types.Mixed;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: {
      type: String,
      enum: ['LOGIN', 'LOGOUT', 'PAGE_VIEW', 'SEARCH'],
      required: true,
    },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

activityLogSchema.index({ schoolId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, activityType: 1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
