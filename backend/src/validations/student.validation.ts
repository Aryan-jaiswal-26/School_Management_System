import { z } from 'zod';

export const admitStudentSchema = z.object({
  body: z.object({
    admissionNumber: z.string().min(1, 'Admission number is required'),
    rollNumber: z.string().optional(),
    classId: z.string().optional(), // Now optional if grade is provided
    sectionId: z.string().optional(), // Now optional if section is provided
    grade: z.string().optional(),
    section: z.string().optional(),
    dob: z.string().datetime('Invalid Date of Birth'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    parentIds: z.array(z.string().min(24)).optional(), // Array of existing parent object IDs
    // For creating new parents during admission:
    newParents: z.array(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6).optional(),
      phone: z.string().min(1),
      relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']),
      occupation: z.string().optional(),
    })).optional(),
    // For creating new student user
    studentUser: z.object({
      email: z.string().email('Invalid student email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
    }).optional()
  }),
});

export const updateStudentSchema = z.object({
  body: z.object({
    rollNumber: z.string().optional(),
    dob: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    parentIds: z.array(z.string().min(24)).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const assignClassSchema = z.object({
  body: z.object({
    classId: z.string().min(24),
    sectionId: z.string().min(24),
  }),
});

export const requestTcSchema = z.object({
  body: z.object({
    reason: z.string().optional()
  }),
});

export const issueTcSchema = z.object({
  body: z.object({
    tcIssueDate: z.string().datetime().optional()
  }),
});

export const studentListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    tcStatus: z.enum(['NONE', 'REQUESTED', 'ISSUED']).optional(),
  }),
});
