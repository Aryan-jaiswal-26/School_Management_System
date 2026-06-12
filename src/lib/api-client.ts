/**
 * Frontend API Client
 * Wraps native fetch to interact with the Express Backend
 */

export const API_BASE_URL =
  import.meta.env?.VITE_API_URL ??
  process.env?.VITE_API_URL ??
  "/api/v1";

export const BASE_URL = import.meta.env?.VITE_API_BASE ?? "/api";

interface RequestOptions extends RequestInit {
  data?: any;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Token refresh mutex ──────────────────────────────────────────────────────
// When multiple requests hit 401 simultaneously we only want ONE refresh call.
let _refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers: customHeaders, ...customConfig } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  let impersonatedSchoolId: string | null = null;
  let currentBranchId: string | null = null;
  if (typeof window !== "undefined") {
    const savedImpersonation = localStorage.getItem("super_admin_impersonation");
    if (savedImpersonation) {
      try {
        const session = JSON.parse(savedImpersonation);
        if (session && session.schoolId) {
          impersonatedSchoolId = session.schoolId;
        }
      } catch (_) {}
    }
    currentBranchId = localStorage.getItem("currentBranchId");
  }

  const config: RequestInit = {
    method: "GET",
    credentials: "include", // Important for sending/receiving secure cookies
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...(impersonatedSchoolId && { "X-Tenant-ID": impersonatedSchoolId }),
      ...(currentBranchId && { "X-Branch-ID": currentBranchId }),
      ...customHeaders,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let response = await fetch(url, config);

  // Note: Since cookies are HttpOnly, we don't manually attach Bearer tokens.
  // The browser attaches them automatically via `credentials: "include"`.

  // ── Auto-refresh on 401 ────────────────────────────────────────────────────
  // If the access token expired, attempt a silent refresh and retry ONCE.
  // Skip refresh attempts for auth endpoints themselves to avoid loops.
  const isAuthEndpoint = endpoint.startsWith("/auth/");
  if (response.status === 401 && !isAuthEndpoint) {
    // Coalesce concurrent refresh calls
    if (!_refreshPromise) {
      _refreshPromise = tryRefreshToken().finally(() => {
        _refreshPromise = null;
      });
    }
    const refreshed = await _refreshPromise;
    if (refreshed) {
      // Retry the original request with the fresh cookie
      response = await fetch(url, config);
    }
  }

  let responseData;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (response.ok) {
    const data = responseData?.data !== undefined ? responseData.data : responseData;
    if (data && typeof data === "object") {
      if (!("data" in data)) {
        Object.defineProperty(data, "data", {
          value: data,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      }
    }
    return data;
  }

  if (response.status === 401) {
    // Token refresh also failed – user session is truly expired
    window.dispatchEvent(new Event("unauthorized"));
  }

  throw new ApiError(
    responseData?.message || `API Error: ${response.statusText}`,
    response.status,
    responseData
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Types (Previously in supabaseClient.ts)
// ─────────────────────────────────────────────────────────────────────────────

export type AppRole =
  | "admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent"
  | "driver"
  | "accountant"
  | "super_admin";

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  full_name?: string;
  role: AppRole;
  avatar_url?: string | null;
  subtitle?: string | null;
  created_at: string;
  schoolId?: string;
  schoolCode?: string;
  studentCode?: string;
  studentId?: string;
  phone?: string;
  address?: string;
  className?: string;
  sectionName?: string;
  parentPhone?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  allowedBranchIds?: string[];
}

export const APP_ROLES: AppRole[] = [
  "super_admin",
  "school_admin",
  "admin",
  "teacher",
  "parent",
  "student",
  "driver",
  "accountant",
];

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as string[]).includes(value);
}
