import mongoose, { Schema, Document, Types } from 'mongoose';
import { IBaseDocument } from './common.js';

export interface IAdmissionLead extends IBaseDocument {
  schoolId: Types.ObjectId;
  studentName: string;
  grade: string;
  parentName: string;
  phone: string;
  status: 'prospect' | 'contacted' | 'interview-scheduled' | 'enrolled';
  callbackDate: Date;
}

const admissionLeadSchema = new Schema<IAdmissionLead>({
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  studentName: { type: String, required: true },
  grade: { type: String, required: true },
  parentName: { type: String, required: true },
  phone: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['prospect', 'contacted', 'interview-scheduled', 'enrolled'],
    default: 'prospect'
  },
  callbackDate: { type: Date },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export const AdmissionLead = mongoose.model<IAdmissionLead>('AdmissionLead', admissionLeadSchema);
