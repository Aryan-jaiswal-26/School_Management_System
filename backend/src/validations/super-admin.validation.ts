import { z } from 'zod';

// Base pagination schema
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
  }),
});

// Authentication
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

// Schools
export const createSchoolSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().min(2, 'Code is required'),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED']).optional(),
  }),
});

export const updateSchoolStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED']),
  }),
});

export const updateSchoolFeaturesSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    featureOverrides: z.record(z.boolean()),
  }),
});

// Subscription Plans
export const createSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.enum(['FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']),
    price: z.number().min(0),
    currency: z.string().default('USD'),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']),
    features: z.array(z.string()),
    limits: z.object({
      maxStudents: z.number().min(1),
      maxTeachers: z.number().min(1),
      maxStorageBytes: z.number().min(1),
    }),
  }),
});

export const updateSubscriptionPlanSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.enum(['FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().default('USD').optional(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
    features: z.array(z.string()).optional(),
    limits: z.object({
      maxStudents: z.number().min(1).optional(),
      maxTeachers: z.number().min(1).optional(),
      maxStorageBytes: z.number().min(1).optional(),
    }).optional(),
  }).optional(),
});

// Announcements
export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(5),
    targetAudience: z.enum(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'SCHOOL_ADMINS']),
    targetClassId: z.string().optional(),
  }),
});

// Settings
export const updateSettingsSchema = z.object({
  body: z.object({
    platformName: z.string().optional(),
    supportEmail: z.string().email().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    smtpConfig: z.object({
      host: z.string(),
      port: z.number(),
      encryption: z.enum(['TLS', 'SSL', 'NONE']),
      username: z.string().optional(),
      password: z.string().optional(),
    }).optional(),
  }),
});

export const updateTicketStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  }),
});

export const createFaqSchema = z.object({
  body: z.object({
    question: z.string().min(5),
    answer: z.string().min(5),
    category: z.string().default('General'),
    order: z.number().optional(),
    isActive: z.boolean().optional()
  }),
});

export const createTermsPrivacySchema = z.object({
  body: z.object({
    version: z.string().min(1),
    content: z.string().min(10),
    isActive: z.boolean().optional()
  }),
});

export const createNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    message: z.string().min(5),
    type: z.string().default('SYSTEM_ALERT'),
    targetSchoolId: z.string().optional(), // If empty, goes to all schools
    channels: z.array(z.enum(['PUSH', 'EMAIL', 'SMS'])).default(['PUSH'])
  }),
});

