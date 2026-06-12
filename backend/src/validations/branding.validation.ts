import { z } from 'zod';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const updateBrandingSchema = z.object({
  body: z.object({
    schoolName: z.string().min(1, 'School name is required'),
    primaryColor: z.string().regex(hexColorRegex, 'Primary color must be a valid hex color').optional(),
    secondaryColor: z.string().regex(hexColorRegex, 'Secondary color must be a valid hex color').optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
  }),
});
