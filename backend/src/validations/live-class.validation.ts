import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createLiveClassSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    subject: z.string().min(1),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.coerce.number().int().min(10).max(240).default(45),
    provider: z.enum(['GOOGLE_MEET', 'ZOOM', 'OTHER']).default('GOOGLE_MEET'),
    meetingLink: z.string().url().optional(),
    meetingCode: z.string().min(3).optional(),
    classId: objectIdSchema.optional(),
    sectionId: objectIdSchema.optional(),
    description: z.string().optional(),
    studyMaterialLinks: z.array(z.string().url()).optional(),
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
  }),
});

export const listLiveClassesQuerySchema = z.object({
  query: z.object({
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
