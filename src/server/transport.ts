/**
 * Transport Management Server Actions - TanStack Start
 * Handles bus routes, GPS tracking, and real-time location updates
 */

import { createServerFn } from "@tanstack/react-start/server";
import { getDBService, DBError, AuthorizationError } from "~/lib/db-service";
import { type AppRole } from "~/lib/schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Server Actions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all transport routes
 */
export const getTransportRoutes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getDBService();
    const routes = await db.getTransportRoutes();

    return {
      success: true,
      data: routes,
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

    console.error("[getTransportRoutes] Error:", error);
    return {
      success: false,
      error: "Failed to fetch transport routes",
      statusCode: 500,
    };
  }
});

/**
 * Update GPS location for a route (real-time tracking)
 */
export const updateGPSLocation = createServerFn({ method: "POST" }).handler(
  async (ctx: {
    routeId: string;
    latitude: number;
    longitude: number;
    tripActive?: boolean;
    userRole: AppRole;
  }) => {
    try {
      // Only drivers and admin can update GPS
      if (!["admin", "teacher"].includes(ctx.userRole)) {
        return {
          success: false,
          error: "Unauthorized: only authorized drivers can update location",
          statusCode: 403,
        };
      }

      // Validate coordinates
      if (ctx.latitude < -90 || ctx.latitude > 90) {
        return {
          success: false,
          error: "Invalid latitude: must be between -90 and 90",
          statusCode: 400,
        };
      }

      if (ctx.longitude < -180 || ctx.longitude > 180) {
        return {
          success: false,
          error: "Invalid longitude: must be between -180 and 180",
          statusCode: 400,
        };
      }

      const db = getDBService();
      const route = await db.updateGPSLocation(
        ctx.routeId,
        ctx.latitude,
        ctx.longitude,
        ctx.tripActive,
      );

      return {
        success: true,
        data: route,
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

      console.error("[updateGPSLocation] Error:", error);
      return {
        success: false,
        error: "Failed to update location",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get active routes with current location
 */
export const getActiveRoutes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const db = getDBService();
    const routes = await db.getTransportRoutes();

    const active = routes.filter((r) => r.trip_active);

    return {
      success: true,
      data: {
        totalActive: active.length,
        routes: active,
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

    console.error("[getActiveRoutes] Error:", error);
    return {
      success: false,
      error: "Failed to fetch active routes",
      statusCode: 500,
    };
  }
});

/**
 * Get transport statistics
 */
export const getTransportStats = createServerFn({ method: "GET" }).handler(
  async (ctx: { userRole: AppRole }) => {
    try {
      const db = getDBService();
      const routes = await db.getTransportRoutes();

      const totalCapacity = routes.reduce((sum, r) => sum + r.capacity, 0);
      const totalStudents = routes.reduce((sum, r) => sum + r.student_count, 0);

      return {
        success: true,
        data: {
          totalRoutes: routes.length,
          activeRoutes: routes.filter((r) => r.trip_active).length,
          totalCapacity,
          totalStudents,
          utilizationPercentage: Math.round((totalStudents / totalCapacity) * 100),
          routes: routes.map((r) => ({
            routeNo: r.route_no,
            busNo: r.bus_no,
            driver: r.driver_name,
            studentCount: r.student_count,
            capacity: r.capacity,
            isActive: r.trip_active,
            lastUpdate: r.last_location_at,
          })),
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

      console.error("[getTransportStats] Error:", error);
      return {
        success: false,
        error: "Failed to fetch transport statistics",
        statusCode: 500,
      };
    }
  },
);

/**
 * Get route details including stops and current location
 */
export const getRouteDetails = createServerFn({ method: "GET" }).handler(
  async (ctx: { routeId: string }) => {
    try {
      const db = getDBService();
      const routes = await db.getTransportRoutes();

      const route = routes.find((r) => r.id === ctx.routeId);

      if (!route) {
        return {
          success: false,
          error: "Route not found",
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: route,
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

      console.error("[getRouteDetails] Error:", error);
      return {
        success: false,
        error: "Failed to fetch route details",
        statusCode: 500,
      };
    }
  },
);
