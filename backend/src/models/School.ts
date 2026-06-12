import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface ISchoolSettings {
  timezone: string;
  currency: string;
  gradingSystem: string;
}

export interface IWhiteLabel {
  primaryColor: string;
  secondaryColor: string;
  faviconUrl?: string;
  logoUrl?: string;
  customTitle?: string;
}

export interface ISchool extends Document, IAuditFields {
  name: string;
  code: string;
  subdomain?: string;
  customDomain?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
  settings?: ISchoolSettings;
  whiteLabel?: IWhiteLabel;
  featureOverrides?: Record<string, boolean>;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    subdomain: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    customDomain: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    address: { type: String },
    contactEmail: { type: String, lowercase: true, trim: true },
    contactPhone: { type: String },
    logo: { type: String },
    settings: {
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: 'USD' },
      gradingSystem: { type: String, default: 'GPA' },
    },
    whiteLabel: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#1e293b' },
      faviconUrl: { type: String },
      logoUrl: { type: String },
      customTitle: { type: String },
    },
    featureOverrides: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED'], default: 'ACTIVE' },
    isActive: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Pre-save middleware to log when a school is storing in db
schoolSchema.pre('save', function() {
  console.log(`[DATABASE SAVE] Attempting to store school in database. Name: "${this.name}", Code: "${this.code}"`);
});

schoolSchema.post('save', function(doc) {
  console.log(`[DATABASE SAVE SUCCESS] Successfully stored school in database. ID: ${doc._id}, Name: "${doc.name}", Code: "${doc.code}"`);
});

// Indexes
schoolSchema.index({ name: 1 });
schoolSchema.index({ isActive: 1 });

export const School = mongoose.model<ISchool>('School', schoolSchema);
