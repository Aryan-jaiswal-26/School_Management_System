import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmergencyDrill extends Document {
  schoolId: Types.ObjectId;
  type: 'fire' | 'earthquake' | 'lockdown' | 'medical' | 'evacuation' | 'other';
  scheduledDate: Date;
  duration: number; // minutes
  description: string;
  location: string;
  coordinator: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  completionNotes?: string;
  participantCount?: number;
  issues?: string;
  nextDrillDate?: Date;
}

const EmergencyDrillSchema = new Schema<IEmergencyDrill>({
  schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
  type: { type: String, enum: ['fire', 'earthquake', 'lockdown', 'medical', 'evacuation', 'other'], required: true },
  scheduledDate: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  description: { type: String, required: true },
  location: { type: String, required: true },
  coordinator: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  completionNotes: String,
  participantCount: Number,
  issues: String,
  nextDrillDate: Date,
}, { timestamps: true });

export const EmergencyDrill = mongoose.model<IEmergencyDrill>('EmergencyDrill', EmergencyDrillSchema);
