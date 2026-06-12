import { z } from 'zod';

// Schema for creating a homework assignment (teachers)
export const createHomeworkSchema = z.object({
  body: z.object({
    classId: z.string().min(24).optional(),
    className: z.string().optional(),
    sectionId: z.string().min(24).optional(),
    sectionName: z.string().optional(),
    subjectId: z.string().min(24).optional(),
    subjectName: z.string().optional(),
    title: z.string().min(3),
    description: z.string().min(3),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    attachments: z.array(z.string()).optional(),
    maxScore: z.number().optional()
  })
});

// Schema for submitting homework (students/parents)
export const submitHomeworkSchema = z.object({
  body: z.object({
    remarks: z.string().optional()
  }).optional()
});

// Schema for uploading study material (teachers)
export const uploadStudyMaterialSchema = z.object({
  body: z.object({
    classId: z.string().min(24).optional(),
    className: z.string().optional(),
    subjectId: z.string().min(24).optional(),
    subjectName: z.string().optional(),
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.enum(['NOTES', 'SYLLABUS', 'REFERENCE', 'VIDEO']).optional()
  })
});

// Schema for grading a homework submission (teachers)
export const gradeSubmissionSchema = z.object({
  body: z.object({
    score: z.number().min(0).optional(),
    feedback: z.string().optional()
  })
});
