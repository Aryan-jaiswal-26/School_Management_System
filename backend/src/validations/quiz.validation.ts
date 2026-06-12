import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    classId: z.string().min(24, 'Invalid class ID'),
    sectionId: z.string().min(24, 'Invalid section ID').optional(),
    question: z.string().min(1, 'Question is required').trim(),
    options: z.array(z.string().min(1, 'Option cannot be empty')).length(4, 'Exactly 4 options required'),
    correctOptionIndex: z.number().int().min(0).max(3),
  })
});

export const submitQuizResponseSchema = z.object({
  body: z.object({
    selectedOptionIndex: z.number().int().min(0).max(3),
  })
});
