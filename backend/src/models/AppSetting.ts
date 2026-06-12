import mongoose, { Schema, Document } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IAppSetting extends Document, IAuditFields {
  platformName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  smtpConfig: {
    host: string;
    port: number;
    encryption: 'TLS' | 'SSL' | 'NONE';
    username?: string;
    password?: string;
  };
  smsConfig: {
    provider: string; // e.g., 'Twilio'
    accountSid?: string;
    authToken?: string;
    senderNumber?: string;
  };
  securityPolicies: {
    require2FAForSuperAdmins: boolean;
    sessionTimeoutMinutes: number;
    passwordExpiryDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const appSettingSchema = new Schema<IAppSetting>(
  {
    platformName: { type: String, default: 'Campus OS' },
    supportEmail: { type: String, default: 'support@campus.os' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    smtpConfig: {
      host: { type: String },
      port: { type: Number, default: 587 },
      encryption: { type: String, enum: ['TLS', 'SSL', 'NONE'], default: 'TLS' },
      username: { type: String },
      password: { type: String },
    },
    smsConfig: {
      provider: { type: String, default: 'Twilio' },
      accountSid: { type: String },
      authToken: { type: String },
      senderNumber: { type: String },
    },
    securityPolicies: {
      require2FAForSuperAdmins: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 30 },
      passwordExpiryDays: { type: Number, default: 90 },
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// We only expect one document to ever exist for global settings
export const AppSetting = mongoose.model<IAppSetting>('AppSetting', appSettingSchema);
