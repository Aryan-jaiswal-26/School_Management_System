import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

export const createClassSchema = z.object({
  body: z.object({
    schoolId: objectIdSchema.optional(),
    name: z.string().min(1, "Class name is required"),
    description: z.string().optional(),
    sections: z.array(z.string()).optional(),
  }),
});

export const listClassesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const listSectionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    classId: objectIdSchema.optional(),
  }),
});

export const createSectionSchema = z.object({
  body: z.object({
    schoolId: objectIdSchema.optional(),
    classId: objectIdSchema,
    name: z.string().min(1, "Section name is required"),
    classTeacherId: objectIdSchema.optional(),
    capacity: z.coerce.number().int().positive().optional(),
  }),
});

export const updateSectionSchema = z.object({
  body: z.object({
    classId: objectIdSchema.optional(),
    name: z.string().min(1).optional(),
    classTeacherId: objectIdSchema.optional().nullable(),
    capacity: z.coerce.number().int().positive().optional().nullable(),
  }),
});

export const listSubjectsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    type: z.enum(["CORE", "ELECTIVE", "LAB"]).optional(),
  }),
});

export const createSubjectSchema = z.object({
  body: z.object({
    schoolId: objectIdSchema.optional(),
    classId: objectIdSchema,
    name: z.string().min(1, "Subject name is required"),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(["CORE", "ELECTIVE", "LAB"]).default("CORE"),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(["CORE", "ELECTIVE", "LAB"]).optional(),
  }),
});

export const listTimetableQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    classId: objectIdSchema.optional(),
    sectionId: objectIdSchema.optional(),
    subjectId: objectIdSchema.optional(),
    teacherId: objectIdSchema.optional(),
    dayOfWeek: z.string().optional(),
  }),
});

export const createTimetableSchema = z.object({
  body: z.object({
    schoolId: objectIdSchema.optional(),
    classId: objectIdSchema,
    sectionId: objectIdSchema.optional(),
    subjectId: objectIdSchema,
    teacherId: objectIdSchema,
    dayOfWeek: z.string().min(1, "Day of week is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    room: z.string().optional(),
  }),
});

export const updateTimetableSchema = z.object({
  body: z.object({
    classId: objectIdSchema.optional(),
    sectionId: objectIdSchema.optional().nullable(),
    subjectId: objectIdSchema.optional(),
    teacherId: objectIdSchema.optional(),
    dayOfWeek: z.string().min(1).optional(),
    startTime: z.string().min(1).optional(),
    endTime: z.string().min(1).optional(),
    room: z.string().optional(),
  }),
});

export const createEventSchema = z.object({
  body: z.object({
    schoolId: objectIdSchema.optional(),
    title: z.string().min(1, "Title is required"),
    date: z.coerce.date(),
    type: z.string().min(1, "Type is required"),
    rsvpCount: z.coerce.number().int().min(0).optional(),
    tickets: z.string().optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    date: z.coerce.date().optional(),
    type: z.string().min(1).optional(),
    rsvpCount: z.coerce.number().int().min(0).optional(),
    tickets: z.string().optional(),
  }),
});
