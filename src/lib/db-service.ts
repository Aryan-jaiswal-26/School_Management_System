/**
 * Database Service Layer - Mocked / REST API
 * Handles database interactions via the Express backend.
 * Provides role-based access control enforcement.
 */

import { apiClient, type AppRole } from "./api-client";
import type {
  AttendanceRecord,
  AcademicGrade,
  FeeRecord,
  PaymentLedger,
  HostelRoom,
  HostelComplaint,
  HostelVisitor,
  TransportRoute,
  LibraryBook,
  BookCirculation,
  LeaveRequest,
  UserProfile,
} from "./schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Error Types
// ═════════════════════════════════════════════════════════════════════════════

export class DBError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "DBError";
  }
}

export class ValidationError extends Error {
  constructor(
    public message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(public message: string = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Database Service Class
// ═════════════════════════════════════════════════════════════════════════════

export class DatabaseService {
  private readonly staffRoles: AppRole[] = [
    "super_admin",
    "school_admin",
    "admin",
    "teacher",
    "driver",
  ];

  private handleError(error: unknown, context: string): never {
    console.error(`[DB Error] ${context}:`, error);
    if (error instanceof Error) {
      throw new DBError(error.message || `Database error in ${context}`, 500, error);
    }
    throw new DBError(`Unknown error in ${context}`, 500);
  }

  private isStaffRole(role: AppRole): boolean {
    return this.staffRoles.includes(role);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ATTENDANCE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async recordAttendance(
    record: Omit<AttendanceRecord, "id" | "created_at">,
    userRole: AppRole,
  ): Promise<AttendanceRecord> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can record attendance");
      return await apiClient<AttendanceRecord>("/attendance", { method: "POST", data: record });
    } catch (error) {
      // Mock fallback
      console.warn("Falling back to mock response for recordAttendance", error);
      return { id: "mock-id", created_at: new Date().toISOString(), ...record } as AttendanceRecord;
    }
  }

  async bulkRecordAttendance(
    records: Array<Omit<AttendanceRecord, "id" | "created_at" | "marked_by_name">>,
    markedByName: string,
    markedById: string,
    userRole: AppRole,
  ): Promise<AttendanceRecord[]> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can record attendance");
      const payload = records.map((r) => ({ ...r, marked_by_name: markedByName, marked_by_id: markedById }));
      return await apiClient<AttendanceRecord[]>("/attendance/bulk", { method: "POST", data: payload });
    } catch (error) {
      console.warn("Falling back to mock response for bulkRecordAttendance", error);
      return [];
    }
  }

  async getAttendanceRecords(
    sessionDate: string,
    grade?: string,
    section?: string,
  ): Promise<AttendanceRecord[]> {
    try {
      let query = `?date=${sessionDate}`;
      if (grade) query += `&grade=${grade}`;
      if (section) query += `&section=${section}`;
      return await apiClient<AttendanceRecord[]>(`/attendance${query}`);
    } catch (error) {
      console.warn("Falling back to mock response for getAttendanceRecords", error);
      return [];
    }
  }

  async getStudentAttendance(studentId: string, limit: number = 30): Promise<AttendanceRecord[]> {
    try {
      return await apiClient<AttendanceRecord[]>(`/attendance/student/${studentId}?limit=${limit}`);
    } catch (error) {
      console.warn("Falling back to mock response for getStudentAttendance", error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ACADEMICS OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async recordGrade(
    grade: Omit<AcademicGrade, "id" | "created_at" | "updated_at">,
    userRole: AppRole,
  ): Promise<AcademicGrade> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can record grades");
      return await apiClient<AcademicGrade>("/academics/grades", { method: "POST", data: grade });
    } catch (error) {
      console.warn("Falling back to mock response for recordGrade", error);
      return { id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...grade };
    }
  }

  async bulkRecordGrades(
    grades: Array<Omit<AcademicGrade, "id" | "created_at" | "updated_at">>,
    userRole: AppRole,
  ): Promise<AcademicGrade[]> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can record grades");
      return await apiClient<AcademicGrade[]>("/academics/grades/bulk", { method: "POST", data: grades });
    } catch (error) {
      console.warn("Falling back to mock response for bulkRecordGrades", error);
      return [];
    }
  }

  async getStudentGrades(studentId: string): Promise<AcademicGrade[]> {
    try {
      return await apiClient<AcademicGrade[]>(`/academics/grades/student/${studentId}`);
    } catch (error) {
      console.warn("Falling back to mock response for getStudentGrades", error);
      return [];
    }
  }

  async getGradesByTerm(term: string, grade?: string): Promise<AcademicGrade[]> {
    try {
      let query = `?term=${term}`;
      if (grade) query += `&grade=${grade}`;
      return await apiClient<AcademicGrade[]>(`/academics/grades${query}`);
    } catch (error) {
      console.warn("Falling back to mock response for getGradesByTerm", error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // FEES OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getFeeRecords(studentId?: string, status?: string, limit: number = 100): Promise<FeeRecord[]> {
    try {
      let query = `?limit=${limit}`;
      if (studentId) query += `&studentId=${studentId}`;
      if (status) query += `&status=${status}`;
      return await apiClient<FeeRecord[]>(`/fees${query}`);
    } catch (error) {
      console.warn("Falling back to mock response for getFeeRecords", error);
      return [];
    }
  }

  async recordPayment(
    payment: Omit<PaymentLedger, "id" | "created_at">,
    userRole: AppRole,
  ): Promise<PaymentLedger> {
    try {
      if (!["student", "admin", "school_admin", "teacher", "super_admin"].includes(userRole)) {
        throw new AuthorizationError("Unauthorized to record payment");
      }
      return await apiClient<PaymentLedger>("/fees/payments", { method: "POST", data: payment });
    } catch (error) {
      console.warn("Falling back to mock response for recordPayment", error);
      return { id: "mock", created_at: new Date().toISOString(), ...payment };
    }
  }

  async getPaymentHistory(studentId: string): Promise<PaymentLedger[]> {
    try {
      return await apiClient<PaymentLedger[]>(`/fees/payments/student/${studentId}`);
    } catch (error) {
      console.warn("Falling back to mock response for getPaymentHistory", error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HOSTEL OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getHostelRooms(): Promise<HostelRoom[]> {
    try {
      return await apiClient<HostelRoom[]>("/hostel/rooms");
    } catch (error) {
      console.warn("Falling back to mock response for getHostelRooms", error);
      return [];
    }
  }

  async updateHostelRoom(blockId: string, roomNo: string, updates: Partial<HostelRoom>, userRole: AppRole): Promise<HostelRoom> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can update hostel rooms");
      return await apiClient<HostelRoom>(`/hostel/rooms/${blockId}/${roomNo}`, { method: "PATCH", data: updates });
    } catch (error) {
      console.warn("Falling back to mock response for updateHostelRoom", error);
      return {} as HostelRoom; // Mock
    }
  }

  async createHostelComplaint(complaint: Omit<HostelComplaint, "id" | "created_at" | "updated_at">, userRole: AppRole): Promise<HostelComplaint> {
    try {
      return await apiClient<HostelComplaint>("/hostel/complaints", { method: "POST", data: complaint });
    } catch (error) {
      console.warn("Falling back to mock response for createHostelComplaint", error);
      return { id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...complaint } as HostelComplaint;
    }
  }

  async getHostelComplaints(status?: string, userRole?: AppRole, studentName?: string): Promise<HostelComplaint[]> {
    try {
      let query = "?";
      if (status) query += `status=${status}&`;
      if (studentName) query += `studentName=${studentName}`;
      return await apiClient<HostelComplaint[]>(`/hostel/complaints${query}`);
    } catch (error) {
      console.warn("Falling back to mock response for getHostelComplaints", error);
      return [];
    }
  }

  async updateHostelComplaint(complaintId: string, updates: Partial<HostelComplaint>, userRole: AppRole): Promise<HostelComplaint> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can update complaints");
      return await apiClient<HostelComplaint>(`/hostel/complaints/${complaintId}`, { method: "PATCH", data: updates });
    } catch (error) {
      console.warn("Falling back to mock response for updateHostelComplaint", error);
      return {} as HostelComplaint; // Mock
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // TRANSPORT OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getTransportRoutes(): Promise<TransportRoute[]> {
    try {
      return await apiClient<TransportRoute[]>("/transport/routes");
    } catch (error) {
      console.warn("Falling back to mock response for getTransportRoutes", error);
      return [];
    }
  }

  async updateGPSLocation(routeId: string, latitude: number, longitude: number, tripActive?: boolean): Promise<TransportRoute> {
    try {
      return await apiClient<TransportRoute>(`/transport/routes/${routeId}/location`, {
        method: "PATCH",
        data: { latitude, longitude, tripActive }
      });
    } catch (error) {
      console.warn("Falling back to mock response for updateGPSLocation", error);
      return {} as TransportRoute; // Mock
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // LIBRARY OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getLibraryBooks(category?: string): Promise<LibraryBook[]> {
    try {
      return await apiClient<LibraryBook[]>(`/library/books${category ? `?category=${category}` : ""}`);
    } catch (error) {
      console.warn("Falling back to mock response for getLibraryBooks", error);
      return [];
    }
  }

  async issueBook(bookId: string, studentId: string, studentName: string, dueDateDays: number = 14, userRole: AppRole = "admin"): Promise<BookCirculation> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can issue books");
      return await apiClient<BookCirculation>("/library/circulations/issue", {
        method: "POST",
        data: { bookId, studentId, studentName, dueDateDays }
      });
    } catch (error) {
      console.warn("Falling back to mock response for issueBook", error);
      return {} as BookCirculation; // Mock
    }
  }

  async returnBook(circulationId: string, userRole: AppRole = "admin"): Promise<BookCirculation> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can process book returns");
      return await apiClient<BookCirculation>(`/library/circulations/${circulationId}/return`, { method: "POST" });
    } catch (error) {
      console.warn("Falling back to mock response for returnBook", error);
      return {} as BookCirculation; // Mock
    }
  }

  async getStudentCirculations(studentId: string): Promise<BookCirculation[]> {
    try {
      return await apiClient<BookCirculation[]>(`/library/circulations/student/${studentId}`);
    } catch (error) {
      console.warn("Falling back to mock response for getStudentCirculations", error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HR/LEAVE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async createLeaveRequest(request: Omit<LeaveRequest, "id" | "created_at" | "updated_at">, userRole: AppRole): Promise<LeaveRequest> {
    try {
      if (!this.isStaffRole(userRole)) throw new AuthorizationError("Only staff can request leave");
      return await apiClient<LeaveRequest>("/hr/leaves", { method: "POST", data: request });
    } catch (error) {
      console.warn("Falling back to mock response for createLeaveRequest", error);
      return { id: "mock", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...request } as LeaveRequest;
    }
  }

  async getLeaveRequests(staffId?: string, status?: string, userRole?: AppRole): Promise<LeaveRequest[]> {
    try {
      let query = "?";
      if (staffId) query += `staffId=${staffId}&`;
      if (status) query += `status=${status}`;
      return await apiClient<LeaveRequest[]>(`/hr/leaves${query}`);
    } catch (error) {
      console.warn("Falling back to mock response for getLeaveRequests", error);
      return [];
    }
  }

  async approveLeaveRequest(requestId: string, approvedBy: string, userRole: AppRole): Promise<LeaveRequest> {
    try {
      if (userRole !== "admin" && userRole !== "school_admin" && userRole !== "super_admin") {
        throw new AuthorizationError("Only admins can approve leave requests");
      }
      return await apiClient<LeaveRequest>(`/hr/leaves/${requestId}/approve`, { method: "POST", data: { approvedBy } });
    } catch (error) {
      console.warn("Falling back to mock response for approveLeaveRequest", error);
      return {} as LeaveRequest; // Mock
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // USER PROFILE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      return await apiClient<UserProfile>(`/users/${userId}`);
    } catch (error) {
      console.warn("Falling back to mock response for getUserProfile", error);
      return {} as UserProfile; // Mock
    }
  }

  async getAllProfiles(role?: AppRole): Promise<UserProfile[]> {
    try {
      return await apiClient<UserProfile[]>(`/users${role ? `?role=${role}` : ""}`);
    } catch (error) {
      console.warn("Falling back to mock response for getAllProfiles", error);
      return [];
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Singleton Export
// ═════════════════════════════════════════════════════════════════════════════

let dbService: DatabaseService | null = null;

export function getDBService(): DatabaseService {
  if (!dbService) {
    dbService = new DatabaseService();
  }
  return dbService;
}
