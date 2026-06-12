import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  schoolId?: Types.ObjectId; // Optional: system-wide events might not belong to a school
  userId: Types.ObjectId;
  action: string;
  module: string;
  resourceId?: string;
  changes?: {
    before?: Schema.Types.Mixed;
    after?: Schema.Types.Mixed;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, uppercase: true, trim: true },
    module: { type: String, required: true, uppercase: true, trim: true },
    resourceId: { type: String, trim: true },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ schoolId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ module: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
