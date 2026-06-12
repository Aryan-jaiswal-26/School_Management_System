import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBranding extends Document {
  schoolId: Types.ObjectId;
  schoolName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandingSchema: Schema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
    schoolName: { type: String, required: true },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
  },
  { timestamps: true }
);

export const Branding = mongoose.model<IBranding>('Branding', BrandingSchema);
