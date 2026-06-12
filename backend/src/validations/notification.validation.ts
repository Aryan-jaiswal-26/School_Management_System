import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    message: z.string().min(3),
    type: z.string().optional(),
    channels: z.array(z.enum(['PUSH', 'EMAIL', 'SMS'])).optional(),
    userIds: z.array(z.string().min(1)).optional(),
    link: z.string().url().optional(),
    scheduledAt: z.string().datetime().optional(),
  }),
});
