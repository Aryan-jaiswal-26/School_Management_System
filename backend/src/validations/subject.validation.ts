import { z } from 'zod';
import { Types } from 'mongoose';

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(1).max(10).regex(/^[A-Z0-9_]+$/),
    description: z.string().optional(),
    type: z.enum(['CORE', 'ELECTIVE', 'LAB'])
  })
});

export const updateSubjectSchema = z.object({
  params: z.object({
    id: z.string().refine(val => Types.ObjectId.isValid(val), { message: 'Invalid subject ID' })
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(1).max(10).regex(/^[A-Z0-9_]+$/).optional(),
    description: z.string().optional(),
    type: z.enum(['CORE', 'ELECTIVE', 'LAB']).optional()
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' })
});
