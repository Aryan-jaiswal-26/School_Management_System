import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotificationReadReceipt extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
}

const NotificationReadReceiptSchema = new Schema<INotificationReadReceipt>({
  notificationId: { type: Schema.Types.ObjectId, required: true, ref: 'Notification' },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  readAt: { type: Date, default: Date.now },
}, { timestamps: true });

NotificationReadReceiptSchema.index({ notificationId: 1, userId: 1 }, { unique: true });

export const NotificationReadReceipt = mongoose.model<INotificationReadReceipt>('NotificationReadReceipt', NotificationReadReceiptSchema);
