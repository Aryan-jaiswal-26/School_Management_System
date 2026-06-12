import { z } from 'zod';

export const createEmergencyAlertSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    message: z.string().min(5),
    category: z.enum(['SOS', 'BROADCAST', 'FIRE_DRILL', 'LOCKDOWN', 'MISSING_STUDENT', 'BUS_SOS']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
    targetAudience: z.enum(['ALL', 'PARENTS', 'STUDENTS', 'TEACHERS', 'STAFF']).default('ALL'),
    status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  }),
});
