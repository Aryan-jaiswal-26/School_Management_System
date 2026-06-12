/**
 * Hostel Management Server Actions - TanStack Start
 * Handles room allocation, complaints, and visitor management
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError } from "~/lib/db-service";
import { HostelComplaintSchema, type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all hostel rooms
 */
export const getHostelRooms = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getDBService();
    const rooms = await db.getHostelRooms();

    return {
      success: true,
      data: rooms,
      statusCode: 200,
    };
  } catch (error) {
    if (error instanceof DBError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    console.error("[getHostelRooms] Error:", error);
    return {
      success: false,
      error: "Failed to fetch hostel rooms",
      statusCode: 500,
    };
  }
});

/**
 * Update hostel room allocation
 */
export const updateHostelRoom = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    block: string;
    roomNo: string;
    capacity?: number;
    occupied?: number;
    studentIds?: string[];
    status?: "available" | "full" | "maintenance";
    userRole: AppRole;
  }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can update hostel rooms",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const updates: any = {};

      if (ctx.capacity) updates.capacity = ctx.capacity;
      if (ctx.occupied !== undefined) updates.occupied = ctx.occupied;
      if (ctx.studentIds) updates.student_ids = ctx.studentIds;
      if (ctx.status) updates.status = ctx.status;

      const room = await db.updateHostelRoom(ctx.block, ctx.roomNo, updates, ctx.userRole);

      return {
        success: true,
        data: room,
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          success: false,
          error: error.message,
          statusCode: 403,
        };
      }

      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[updateHostelRoom] Error:", error);
      return {
        success: false,
        error: "Failed to update hostel room",
        statusCode: 500,
      };
    }
  },
);

/**
 * Create a hostel complaint
 */
export const createHostelComplaint = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    studentId?: string;
    studentName: string;
    room: string;
    category: string;
    description: string;
    userRole: AppRole;
  }) => {
    try {
      const validationResult = HostelComplaintSchema.omit({
        id: true,
        created_at: true,
        updated_at: true,
      }).safeParse({
        student_id: ctx.studentId,
        student_name: ctx.studentName,
        room: ctx.room,
        category: ctx.category,
        description: ctx.description,
        status: "open",
        reported_by: ctx.studentName,
      });

      if (!validationResult.success) {
        return {
          success: false,
          error: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
          statusCode: 400,
        };
      }

      const db = getDBService();
      const complaint = await db.createHostelComplaint(validationResult.data, ctx.userRole);

      return {
        success: true,
        data: complaint,
        statusCode: 201,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[createHostelComplaint] Error:", error);
      return {
        success: false,
        error: "Failed to create complaint",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get hostel complaints with optional filtering
 */
export const getHostelComplaints = createServerFn({ method: "GET" }).handler(
  async (ctx: { status?: string; studentName?: string; userRole: AppRole }) => {
    try {
      const db = getDBService();
      const complaints = await db.getHostelComplaints(ctx.status, ctx.userRole, ctx.studentName);

      return {
        success: true,
        data: complaints,
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getHostelComplaints] Error:", error);
      return {
        success: false,
        error: "Failed to fetch complaints",
        statusCode: 500,
      };
    }
  },
);

/**
 * Update hostel complaint status
 */
export const updateComplaintStatus = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    complaintId: string;
    status: "open" | "in-progress" | "resolved" | "emergency";
    userRole: AppRole;
  }) => {
    try {
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only staff can update complaints",
          statusCode: 403,
        };
      }

      const db = getDBService();
      const complaint = await db.updateHostelComplaint(
        ctx.complaintId,
        { status: ctx.status },
        ctx.userRole,
      );

      return {
        success: true,
        data: complaint,
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          success: false,
          error: error.message,
          statusCode: 403,
        };
      }

      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[updateComplaintStatus] Error:", error);
      return {
        success: false,
        error: "Failed to update complaint",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get hostel statistics
 */
export const getHostelStats = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      const db = getDBService();
      const rooms = await db.getHostelRooms();
      const complaints = await db.getHostelComplaints(undefined, ctx.userRole);

      const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
      const totalOccupied = rooms.reduce((sum, r) => sum + r.occupied, 0);
      const availableSpaces = totalCapacity - totalOccupied;

      const complaintStats = {
        open: complaints.filter((c) => c.status === "open").length,
        inProgress: complaints.filter((c) => c.status === "in-progress").length,
        resolved: complaints.filter((c) => c.status === "resolved").length,
        emergency: complaints.filter((c) => c.status === "emergency").length,
      };

      return {
        success: true,
        data: {
          totalRooms: rooms.length,
          totalCapacity,
          totalOccupied,
          occupancyPercentage: Math.round((totalOccupied / totalCapacity) * 100),
          availableSpaces,
          roomsInMaintenance: rooms.filter((r) => r.status === "maintenance").length,
          complaintStats,
        },
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof DBError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }

      console.error("[getHostelStats] Error:", error);
      return {
        success: false,
        error: "Failed to fetch hostel statistics",
        statusCode: 500,
      };
    }
  },
);
