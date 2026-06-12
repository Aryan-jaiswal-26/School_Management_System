import type { Request, Response, NextFunction } from 'express';
import { BrandingService } from '../services/branding.service.js';
import { resolveSchoolId } from '../utils/school.js';
import { School } from '../models/School.js';

export class BrandingController {
  static async getBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = await resolveSchoolId(req.user?.schoolId);
      const branding = await BrandingService.getBranding(schoolId.toString());

      if (!branding) {
        // Fallback to School record if no branding configured yet
        const school = await School.findById(schoolId).exec();
        res.status(200).json({
          schoolName: school?.name || 'School ERP',
          primaryColor: '#1e40af',
          secondaryColor: '#f59e0b',
          logoUrl: school?.logo || '',
          faviconUrl: ''
        });
        return;
      }

      res.status(200).json({
        schoolName: branding.schoolName,
        primaryColor: branding.primaryColor || '#1e40af',
        secondaryColor: branding.secondaryColor || '#f59e0b',
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || ''
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = await resolveSchoolId(req.user?.schoolId);
      const branding = await BrandingService.updateBranding(schoolId.toString(), req.body);

      res.status(200).json({
        schoolName: branding?.schoolName,
        primaryColor: branding?.primaryColor,
        secondaryColor: branding?.secondaryColor,
        logoUrl: branding?.logoUrl,
        faviconUrl: branding?.faviconUrl
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const schoolId = await resolveSchoolId(req.user?.schoolId);
      const fileUrl = `/uploads/branding/${req.file.filename}`;

      await BrandingService.setLogoUrl(schoolId.toString(), fileUrl);

      res.status(200).json({ url: fileUrl });
    } catch (error) {
      next(error);
    }
  }

  static async uploadFavicon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const schoolId = await resolveSchoolId(req.user?.schoolId);
      const fileUrl = `/uploads/branding/${req.file.filename}`;

      await BrandingService.setFaviconUrl(schoolId.toString(), fileUrl);

      res.status(200).json({ url: fileUrl });
    } catch (error) {
      next(error);
    }
  }
}
