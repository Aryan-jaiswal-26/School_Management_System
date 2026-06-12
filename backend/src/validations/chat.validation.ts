import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    type: z.enum(['DIRECT', 'GROUP', 'PARENT_TEACHER']).optional(),
    participants: z.array(z.string().min(1)).min(1),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1).optional(),
    attachments: z.array(z.string().url()).optional(),
    replyTo: z.string().optional(),
  }).refine((body) => body.text || (body.attachments && body.attachments.length > 0), {
    message: 'Message must contain text or at least one attachment',
  }),
});
