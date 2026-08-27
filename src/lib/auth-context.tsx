import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  apiClient,
  type AppRole,
  type UserProfile,
  isAppRole,
  ApiError,
} from "@/lib/api-client";

// Extending the generic UserProfile here if needed or we can just rely on the any mapping.
import { DEMO_IDS, DEMO_STUDENT_ID } from "@/lib/demo-ids";

export type UserRole = AppRole;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  sub: string;
  avatar?: string;
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
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isMockMode: boolean;
  currentBranchId: string | null;
  setCurrentBranchId: (id: string | null) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  launchSuperAdminDemo: () => Promise<{ success: boolean; error?: string; user?: AuthUser } | void>;
}

const AUTH_STORAGE_KEY = "campus_os_auth";

// Authentication is local-only; demo accounts are stored in this frontend.
const useBackend = false;

const MOCK_ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  "admin@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.admin,
      email: "admin@school.com",
      name: "Priya Menon",
      role: "admin",
      initials: "PM",
      sub: "Principal",
    },
  },
  "schooladmin@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.admin,
      email: "schooladmin@school.com",
      name: "Priya Menon",
      role: "school_admin",
      initials: "PM",
      sub: "School Administrator",
    },
  },
  "teacher@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.teacher,
      email: "teacher@school.com",
      name: "Anita Iyer",
      role: "teacher",
      initials: "AI",
      sub: "Mathematics · HOD",
    },
  },
  "student@school.com": {
    password: "123",
    user: {
      id: DEMO_STUDENT_ID,
      email: "student@school.com",
      name: "Aarav Sharma",
      role: "student",
      initials: "AS",
      sub: "Grade 10 · A",
    },
  },
  "parent@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.parent,
      email: "parent@school.com",
      name: "Ramesh Sharma",
      role: "parent",
      initials: "RS",
      sub: "Parent of Aarav & Ananya",
    },
  },
  "driver@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.teacher,
      email: "driver@school.com",
      name: "Suresh Kumar",
      role: "driver",
      initials: "SK",
      sub: "Transport Operator",
    },
  },
};

const DEMO_SUPER_ADMIN_USER: AuthUser = {
  id: "demo-super-admin",
  email: "superadmin@school.com",
  name: "Super Admin",
  role: "super_admin",
  initials: "SA",
  sub: "Global Platform Administrator",
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function roleSubtitle(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    super_admin: "Super Administrator",
    school_admin: "School Administrator",
    admin: "Administrator",
    teacher: "Faculty",
    parent: "Parent",
    student: "Student",
    driver: "Transport Operator",
  };
  return labels[role];
}

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function profileToAuthUser(profile: UserProfile): AuthUser {
  const name = profile.full_name?.trim() || profile.name?.trim() || profile.email.split("@")[0] || "User";
  return {
    id: profile.id,
    email: profile.email,
    name,
    role: profile.role,
    initials: initialsFromName(name),
    sub: profile.subtitle?.trim() || roleSubtitle(profile.role),
    avatar: profile.avatar_url ?? undefined,
    schoolId: profile.schoolId,
    schoolCode: (profile as any).schoolCode,
    studentCode: (profile as any).studentCode,
    studentId: profile.studentId,
    phone: profile.phoneNumber ?? profile.phone,
    address: profile.address,
    className: profile.className,
    sectionName: profile.sectionName,
    parentPhone: profile.parentPhone,
    gender: profile.gender,
    dob: profile.dob,
    bloodGroup: profile.bloodGroup,
    allowedBranchIds: profile.allowedBranchIds,
  };
}

function backendUserToProfile(response: any): UserProfile {
  const roleValue = typeof response?.role === "string" ? response.role.toLowerCase() : "student";
  return {
    id: response?.id || response?._id || "",
    email: response?.email || "",
    name: response?.fullName || response?.name,
    full_name: response?.fullName || response?.name,
    role: roleValue as AppRole,
    avatar_url: response?.avatar_url || response?.profilePicture || null,
    subtitle: response?.subtitle || roleSubtitle(roleValue as AppRole),
    created_at: response?.createdAt || new Date().toISOString(),
    schoolId: response?.schoolId,
    schoolCode: response?.schoolCode,
    studentCode: response?.studentCode,
    studentId: response?.studentId,
    phone: response?.phone || response?.phoneNumber || "",
    address: response?.address || "",
    className: response?.className || "",
    sectionName: response?.sectionName || "",
    parentPhone: response?.parentPhone || "",
    gender: response?.gender || "",
    dob: response?.dob || "",
    bloodGroup: response?.bloodGroup || "",
    allowedBranchIds: response?.allowedBranchIds,
  };
}

async function fetchProfile(): Promise<UserProfile | null> {
  try {
    // Calling the backend /me endpoint
    const response = await apiClient<any>("/auth/me");
    if (!response || !response.email) return null;

    return backendUserToProfile(response);
  } catch (error) {
    // Silently return null for unauthorized status codes (which is expected if the user isn't logged in yet)
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }
    console.error("Profile fetch failed:", error);
    return null;
  }
}

export function isAdminPortalRole(role: UserRole): boolean {
  return role === "admin" || role === "school_admin" || role === "super_admin";
}

export function getRolePath(role: UserRole, schoolId?: string): string {
  switch (role) {
    case "super_admin":
      return schoolId ? "/admin" : "/super-admin";
    case "school_admin":
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "driver":
      return "/driver";
    default:
      return "/login";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isMockMode = !useBackend;

  const [user, setUser] = useState<AuthUser | null>(() =>
    isMockMode && typeof window !== "undefined" ? loadPersistedUser() : null,
  );
  const [authLoading, setAuthLoading] = useState(!isMockMode);

  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentBranchId");
    }
    return null;
  });

  const setCurrentBranchId = useCallback((id: string | null) => {
    setCurrentBranchIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("currentBranchId", id);
      } else {
        localStorage.removeItem("currentBranchId");
      }
      window.dispatchEvent(new Event("branchChanged"));
    }
  }, []);

  useEffect(() => {
    if (user && user.allowedBranchIds && user.allowedBranchIds.length > 0) {
      if (!currentBranchId || !user.allowedBranchIds.includes(currentBranchId)) {
        setCurrentBranchId(user.allowedBranchIds[0]);
      }
    } else if (!user) {
      setCurrentBranchId(null);
    }
  }, [user, currentBranchId, setCurrentBranchId]);

  useEffect(() => {
    if (isMockMode) {
      persistUser(user);
    }
  }, [user, isMockMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem("parent_active_child");
      localStorage.removeItem("parent_active_child_name");
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, []);

  const hydrateFromSession = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      if (profile) {
        setUser(profileToAuthUser(profile));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session restore failed:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAuthLoading(false);
      return;
    }

    if (isMockMode) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      await hydrateFromSession();
      if (mounted) setAuthLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [hydrateFromSession, isMockMode]);

  const login = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      if (isMockMode) {
        const account = MOCK_ACCOUNTS[normalizedEmail];
        if (!account) {
          return { success: false, error: "No account found with this email" };
        }
        if (account.password !== password) {
          return { success: false, error: "Incorrect password" };
        }
        setUser(account.user);
        return { success: true, user: account.user };
      }

      try {
        const response = await apiClient<any>("/auth/login", {
          method: "POST",
          data: { email: normalizedEmail, password },
        });

        const authUser = profileToAuthUser(backendUserToProfile(response));
        setUser(authUser);
        return { success: true, user: authUser };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error during sign in";
        return { success: false, error: message };
      }
    },
    [isMockMode],
  );

  const logout = useCallback(async () => {
    if (!isMockMode) {
      try {
        await apiClient("/auth/logout", { method: "POST" });
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("parent_active_child");
      localStorage.removeItem("parent_active_child_name");
    }
  }, [isMockMode]);

  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        if (updates.name) next.initials = initialsFromName(updates.name);
        return next;
      });

      if (!isMockMode) {
        try {
          await apiClient("/auth/profile", {
            method: "PUT",
            data: {
              fullName: updates.name,
              phone: updates.phone,
              address: updates.address,
              parentPhone: updates.parentPhone,
              bloodGroup: updates.bloodGroup,
            },
          });
        } catch (err) {
          console.error("Failed to update profile on backend:", err);
        }
      }
    },
    [isMockMode],
  );

  const launchSuperAdminDemo = useCallback(async () => {
    if (isMockMode) {
      setUser(DEMO_SUPER_ADMIN_USER);
      return { success: true, user: DEMO_SUPER_ADMIN_USER };
    }
    return login("superadmin@school.com", "admin123");
  }, [isMockMode, login]);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      authLoading,
      isMockMode,
      currentBranchId,
      setCurrentBranchId,
      login,
      logout,
      updateProfile,
      launchSuperAdminDemo,
    }),
    [user, authLoading, isMockMode, currentBranchId, setCurrentBranchId, login, logout, updateProfile, launchSuperAdminDemo],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // SSR-safe fallback: during server-side rendering the provider may not be mounted.
    // Return a harmless stub that prevents runtime exceptions and allows routes
    // to render a loading state instead of crashing. On the client this should
    // always be replaced by the real provider value.
    if (typeof window === "undefined") {
      return {
        user: null,
        isAuthenticated: false,
        authLoading: true,
        isMockMode: true,
        currentBranchId: null,
        setCurrentBranchId: () => {},
        login: async () => ({ success: false, error: "SSR stub" }),
        logout: async () => {},
        updateProfile: async () => {},
        launchSuperAdminDemo: async () => {},
      } as unknown as AuthContextValue;
    }

    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
