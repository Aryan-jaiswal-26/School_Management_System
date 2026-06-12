import { Router } from 'express';
import { BrandingController } from '../../controllers/branding.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { createUpload } from '../../middleware/upload.js';
import { updateBrandingSchema } from '../../validations/branding.validation.js';

export const brandingRouter = Router();

const brandingUpload = createUpload({
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ],
  maxSize: 2 * 1024 * 1024, // 2MB limit
  subFolder: 'branding'
});

// GET branding - accessible to any authenticated user to fetch active theme/logo
brandingRouter.get(
  '/',
  authenticateToken,
  BrandingController.getBranding
);

// PUT branding - restricted to SUPER_ADMIN and SCHOOL_ADMIN
brandingRouter.put(
  '/',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validateRequest(updateBrandingSchema),
  BrandingController.updateBranding
);

// POST logo upload - restricted to SUPER_ADMIN and SCHOOL_ADMIN
brandingRouter.post(
  '/logo',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  brandingUpload.single('file'), // matches frontend 'file' field
  BrandingController.uploadLogo
);

// POST favicon upload - restricted to SUPER_ADMIN and SCHOOL_ADMIN
brandingRouter.post(
  '/favicon',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  brandingUpload.single('file'), // matches frontend 'file' field
  BrandingController.uploadFavicon
);
