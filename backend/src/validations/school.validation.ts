import { z } from 'zod';

export const createSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'School name is required'),
    code: z.string().min(1, 'School code is required').toUpperCase(),
    address: z.string().optional(),
    contactEmail: z.string().email('Invalid email address').optional(),
    contactPhone: z.string().optional(),
    logo: z.string().url('Logo must be a valid URL').optional(),
    settings: z.object({
      timezone: z.string().optional(),
      currency: z.string().optional(),
      gradingSystem: z.string().optional(),
    }).optional(),
  }),
});

export const updateSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).toUpperCase().optional(),
    address: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    logo: z.string().url().optional(),
    settings: z.object({
      timezone: z.string().optional(),
      currency: z.string().optional(),
      gradingSystem: z.string().optional(),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createAcademicYearSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Academic year name is required'),
    schoolId: z.string().min(24, 'Invalid school ID').optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().optional(),
  }),
});

export const updateAcademicYearSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isCurrent: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Semester name is required'),
    schoolId: z.string().min(24, 'Invalid school ID').optional(),
    academicYearId: z.string().min(24, 'Invalid academic year ID'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }),
});

export const updateSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    schoolId: z.string().min(24, 'Invalid school ID'),
    name: z.string().min(1, 'Branch name is required'),
    code: z.string().min(1, 'Branch code is required').toUpperCase(),
    address: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }),
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).toUpperCase().optional(),
    address: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Common pagination and filter validation
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
