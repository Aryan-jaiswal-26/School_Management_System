import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IPlatformSettings extends Document, IAuditFields {
  general: {
    platformName: string;
    platformLogo: string;
    contactEmail: string;
    supportEmail: string;
  };
  auth: {
    passwordMinLength: number;
    passwordExpiryDays: number;
    enforceTwoFactor: boolean;
    sessionTimeoutMinutes: number;
  };
  communication: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smsGatewayUrl: string;
    smsGatewayKey: string;
  };
  security: {
    ipWhitelist: string[];
    maxLoginAttempts: number;
  };
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    general: {
      platformName: { type: String, default: 'School Management System' },
      platformLogo: { type: String, default: '' },
      contactEmail: { type: String, default: 'admin@example.com' },
      supportEmail: { type: String, default: 'support@example.com' },
    },
    auth: {
      passwordMinLength: { type: Number, default: 8 },
      passwordExpiryDays: { type: Number, default: 90 },
      enforceTwoFactor: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 60 },
    },
    communication: {
      smtpHost: { type: String, default: '' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
      smsGatewayUrl: { type: String, default: '' },
      smsGatewayKey: { type: String, default: '' },
    },
    security: {
      ipWhitelist: [{ type: String }],
      maxLoginAttempts: { type: Number, default: 5 },
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
