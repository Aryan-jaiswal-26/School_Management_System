import { Branding, IBranding } from '../models/branding.js';
import { Types } from 'mongoose';

export class BrandingService {
  static async getBranding(schoolId: string): Promise<IBranding | null> {
    return Branding.findOne({ schoolId: new Types.ObjectId(schoolId) }).exec();
  }

  static async updateBranding(schoolId: string, data: Partial<IBranding>): Promise<IBranding | null> {
    return Branding.findOneAndUpdate(
      { schoolId: new Types.ObjectId(schoolId) },
      data,
      { new: true, upsert: true }
    ).exec();
  }

  static async setLogoUrl(schoolId: string, url: string): Promise<IBranding | null> {
    return Branding.findOneAndUpdate(
      { schoolId: new Types.ObjectId(schoolId) },
      { logoUrl: url },
      { new: true, upsert: true }
    ).exec();
  }

  static async setFaviconUrl(schoolId: string, url: string): Promise<IBranding | null> {
    return Branding.findOneAndUpdate(
      { schoolId: new Types.ObjectId(schoolId) },
      { faviconUrl: url },
      { new: true, upsert: true }
    ).exec();
  }
}
