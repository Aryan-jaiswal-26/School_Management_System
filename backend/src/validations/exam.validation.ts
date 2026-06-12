import { z } from 'zod';

export const createExamSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    classId: z.string().min(24),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    subject: z.string().optional(),
    grade: z.string().optional(),
    room: z.string().optional(),
    description: z.string().optional(),
    gradingScheme: z.object({
      aThreshold: z.coerce.number().min(0).max(100).optional(),
      bThreshold: z.coerce.number().min(0).max(100).optional(),
      cThreshold: z.coerce.number().min(0).max(100).optional(),
      dThreshold: z.coerce.number().min(0).max(100).optional(),
      passMark: z.coerce.number().min(0).max(100).optional(),
    }).optional(),
  })
});

export const updateExamStatusSchema = z.object({
  body: z.object({
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'PUBLISHED']),
  })
});

export const publishResultsSchema = z.object({
  body: z.object({
    publishedAt: z.string().datetime().optional(),
  }).optional(),
});

export const bulkMarksEntrySchema = z.object({
  body: z.object({
    subjectId: z.string().min(24),
    records: z.array(z.object({
      studentId: z.string().min(24),
      marksObtained: z.coerce.number().min(0),
      maxMarks: z.coerce.number().min(1),
      remarks: z.string().optional()
    })).min(1)
  })
});
