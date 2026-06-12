import { z } from 'zod';

export const markStudentAttendanceSchema = z.object({
  body: z.object({
    classId: z.string().min(24),
    sectionId: z.string().min(24),
    date: z.string().datetime(),
    records: z.array(z.object({
      studentId: z.string().min(24),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXEMPTION']),
      remarks: z.string().optional()
    })).min(1)
  })
});

export const dailyStatsQuerySchema = z.object({
  query: z.object({
    date: z.string().datetime().optional(),
    classId: z.string().min(24).optional(),
    sectionId: z.string().min(24).optional(),
    employeeType: z.enum(['TEACHING', 'NON_TEACHING']).optional(),
  })
});

export const monthlyStatsQuerySchema = z.object({
  query: z.object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2000),
  })
});
