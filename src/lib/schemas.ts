/**
 * Zod schemas for server-side validation
 * Used by all API endpoints and server functions
 */

import { z } from "zod";

// ═════════════════════════════════════════════════════════════════════════════
// Shared/Enums
// ═════════════════════════════════════════════════════════════════════════════

export const AppRoleEnum = z.enum([
  "admin",
  "school_admin",
  "teacher",
  "student",
  "parent",
  "driver",
  "super_admin",
]);
export type AppRole = z.infer<typeof AppRoleEnum>;

export const AttendanceStatusEnum = z.enum(["present", "absent", "late", "leave"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;

export const FeeStatusEnum = z.enum(["paid", "partial", "overdue", "pending"]);
export type FeeStatus = z.infer<typeof FeeStatusEnum>;

export const HostelComplaintStatusEnum = z.enum(["open", "in-progress", "resolved", "emergency"]);
export type HostelComplaintStatus = z.infer<typeof HostelComplaintStatusEnum>;

export const CirculationStatusEnum = z.enum(["issued", "returned", "overdue"]);
export type CirculationStatus = z.infer<typeof CirculationStatusEnum>;

export const PaymentStatusEnum = z.enum(["success", "pending", "failed"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// ═════════════════════════════════════════════════════════════════════════════
// User/Profile Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: AppRoleEnum,
  avatar_url: z.string().url().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Attendance Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const AttendanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  session_date: z.string().date(),
  grade: z.string().min(1),
  section: z.string().min(1),
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  status: AttendanceStatusEnum,
  marked_by_name: z.string().min(1),
  marked_by_id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
});

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const BulkAttendanceInputSchema = z.array(
  z.object({
    student_id: z.string().uuid(),
    student_name: z.string().min(1),
    status: AttendanceStatusEnum,
  }),
);

export type BulkAttendanceInput = z.infer<typeof BulkAttendanceInputSchema>;

export const AttendanceFilterSchema = z.object({
  session_date: z.string().date(),
  grade: z.string().optional(),
  section: z.string().optional(),
  status: AttendanceStatusEnum.optional(),
});

export type AttendanceFilter = z.infer<typeof AttendanceFilterSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Academic Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const AcademicGradeSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  subject: z.string().min(1),
  grade: z.string().min(1),
  section: z.string().min(1),
  score: z.number().int().min(0).max(100),
  max_score: z.number().int().min(1).default(100),
  term: z.string().min(1),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AcademicGrade = z.infer<typeof AcademicGradeSchema>;

export const BulkGradesInputSchema = z.array(
  AcademicGradeSchema.omit({ id: true, created_at: true, updated_at: true }),
);

export type BulkGradesInput = z.infer<typeof BulkGradesInputSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Fee Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const FeeCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  frequency: z.enum(["monthly", "quarterly", "annual", "one-time"]),
  description: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

export type FeeCategory = z.infer<typeof FeeCategorySchema>;

export const FeeRecordSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  grade: z.string().min(1),
  category_id: z.string().uuid(),
  category: z.string().min(1),
  amount: z.number().positive(),
  paid: z.number().nonnegative(),
  due: z.number().nonnegative(),
  due_date: z.string().date(),
  status: FeeStatusEnum,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type FeeRecord = z.infer<typeof FeeRecordSchema>;

export const PaymentLedgerSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  fee_record_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["bank_transfer", "card", "cash", "cheque", "upi"]),
  receipt_no: z.string().optional(),
  gateway_ref: z.string().optional(),
  status: PaymentStatusEnum,
  paid_by: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

export type PaymentLedger = z.infer<typeof PaymentLedgerSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Hostel Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const HostelRoomSchema = z.object({
  id: z.string().uuid().optional(),
  block: z.string().min(1).max(10),
  room_no: z.string().min(1).max(10),
  capacity: z.number().int().positive(),
  occupied: z.number().int().nonnegative(),
  student_ids: z.array(z.string().uuid()).default([]),
  status: z.enum(["available", "full", "maintenance"]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type HostelRoom = z.infer<typeof HostelRoomSchema>;

export const HostelComplaintSchema = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  student_name: z.string().min(1),
  room: z.string().min(1),
  category: z.enum(["plumbing", "electrical", "maintenance", "cleaning", "security", "other"]),
  description: z.string().min(10),
  status: HostelComplaintStatusEnum,
  reported_by: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type HostelComplaint = z.infer<typeof HostelComplaintSchema>;

export const HostelVisitorSchema = z.object({
  id: z.string().uuid().optional(),
  visitor_name: z.string().min(1),
  student_name: z.string().min(1),
  room: z.string().min(1),
  purpose: z.string().min(1),
  check_in: z.string().datetime(),
  check_out: z.string().datetime().nullable().optional(),
  status: z.enum(["checked-in", "checked-out", "pending"]),
  created_at: z.string().datetime().optional(),
});

export type HostelVisitor = z.infer<typeof HostelVisitorSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Transport Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const TransportRouteSchema = z.object({
  id: z.string().uuid().optional(),
  route_no: z.string().min(1).max(50),
  driver_name: z.string().min(1),
  driver_phone: z.string().min(10).max(15),
  driver_profile_id: z.string().uuid().optional(),
  bus_no: z.string().min(1).max(20),
  capacity: z.number().int().positive(),
  student_count: z.number().int().nonnegative(),
  stops: z.array(
    z.object({
      name: z.string(),
      time: z.string(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  ),
  current_lat: z.number().optional(),
  current_lng: z.number().optional(),
  trip_active: z.boolean().default(false),
  last_location_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TransportRoute = z.infer<typeof TransportRouteSchema>;

export const GPSUpdateSchema = z.object({
  route_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  trip_active: z.boolean().optional(),
});

export type GPSUpdate = z.infer<typeof GPSUpdateSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// Library Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const LibraryBookSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  category: z.string().min(1),
  total_copies: z.number().int().positive(),
  available_copies: z.number().int().nonnegative(),
  shelf: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type LibraryBook = z.infer<typeof LibraryBookSchema>;

export const BookCirculationSchema = z.object({
  id: z.string().uuid().optional(),
  book_id: z.string().uuid(),
  book_title: z.string().min(1),
  student_id: z.string().uuid(),
  student_name: z.string().min(1),
  issued_date: z.string().date(),
  due_date: z.string().date(),
  returned_date: z.string().date().nullable().optional(),
  status: CirculationStatusEnum,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type BookCirculation = z.infer<typeof BookCirculationSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// HR/Leave Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const LeaveRequestSchema = z.object({
  id: z.string().uuid().optional(),
  staff_id: z.string().uuid(),
  staff_name: z.string().min(1),
  leave_type: z.enum(["sick", "casual", "earned", "maternity", "unpaid", "other"]),
  start_date: z.string().date(),
  end_date: z.string().date(),
  reason: z.string().min(10),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  approved_by: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

// ═════════════════════════════════════════════════════════════════════════════
// API Response Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  errors: z.record(z.string()).optional(),
  statusCode: z.number().int(),
});

export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    pages: z.number().int(),
  }),
  statusCode: z.number().int(),
});

export type PaginatedResponse<T = unknown> = z.infer<typeof PaginatedResponseSchema> & {
  data: T[];
};

// ═════════════════════════════════════════════════════════════════════════════
// Admission Schemas
// ═════════════════════════════════════════════════════════════════════════════

export const AdmissionApplicationStatusEnum = z.enum([
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "Waitlisted",
]);
export type AdmissionApplicationStatus = z.infer<typeof AdmissionApplicationStatusEnum>;

export const DocumentTypeEnum = z.enum([
  "Birth Certificate",
  "Previous Marksheet",
  "Transfer Certificate",
  "Address Proof",
  "Photo",
  "Other",
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DocumentVerificationStatusEnum = z.enum(["Pending", "Verified", "Rejected"]);
export type DocumentVerificationStatus = z.infer<typeof DocumentVerificationStatusEnum>;

export const DocumentVerificationSchema = z.object({
  id: z.string(),
  documentType: DocumentTypeEnum,
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  uploadedAt: z.string().datetime(),
  verificationStatus: DocumentVerificationStatusEnum,
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export type DocumentVerification = z.infer<typeof DocumentVerificationSchema>;

export const AdmissionApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  studentName: z.string().min(1),
  fatherName: z.string().min(1),
  motherName: z.string().min(1),
  dateOfBirth: z.string().date(),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().email(),
  phone: z.string().min(10),
  currentSchool: z.string().optional(),
  currentGrade: z.string().min(1),
  applyingForGrade: z.string().min(1),
  address: z.string().min(5),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  applicationStatus: AdmissionApplicationStatusEnum.default("Draft"),
  appliedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
  waitlistPosition: z.number().int().optional(),
  rejectionReason: z.string().optional(),
  documents: z.array(DocumentVerificationSchema).default([]),
  admissionFeeStatus: z.enum(["Pending", "Paid", "Waived"]).default("Pending"),
  admissionFeeAmount: z.number().nonnegative(),
  notes: z.string().optional(),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(10),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type AdmissionApplication = z.infer<typeof AdmissionApplicationSchema>;

export const AdmissionOfferLetterSchema = z.object({
  id: z.string().uuid().optional(),
  applicationId: z.string().uuid(),
  studentName: z.string().min(1),
  admittedGrade: z.string().min(1),
  section: z.string().optional(),
  academicYear: z.string().min(4),
  offerIssuedAt: z.string().datetime(),
  offerValidUntil: z.string().date(),
  conditions: z.array(z.string()).default([]),
  status: z.enum(["Issued", "Accepted", "Rejected", "Expired"]),
  acceptedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
});

export type AdmissionOfferLetter = z.infer<typeof AdmissionOfferLetterSchema>;
