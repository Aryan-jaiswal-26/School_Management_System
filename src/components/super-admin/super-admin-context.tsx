import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export interface ImpersonationSession {
  schoolId: string;
  schoolName: string;
  role: "admin";
}

// Keep this for backward compat with School type used in directory
export interface School {
  id: string;
  name: string;
  code?: string;
}

interface SuperAdminUser {
  id: string;
  email: string;
  role: string;
}

interface SuperAdminContextValue {
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeImpersonation: ImpersonationSession | null;
  login: (token: string, user: SuperAdminUser) => void;
  logout: () => void;
  impersonateSchool: (id: string, name: string) => void;
  exitImpersonation: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextValue | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const { user: mainUser, authLoading, logout: mainLogout } = useAuth();
  const [activeImpersonation, setActiveImpersonation] = useState<ImpersonationSession | null>(null);

  // Restore impersonation session from localStorage on mount
  useEffect(() => {
    const savedImpersonation = localStorage.getItem("super_admin_impersonation");
    if (savedImpersonation) {
      try {
        setActiveImpersonation(JSON.parse(savedImpersonation));
      } catch {
        localStorage.removeItem("super_admin_impersonation");
      }
    }
  }, []);

  // Derive super-admin user directly from the main auth context
  // (super_admin role in main auth = authenticated in super-admin portal)
  const isSuperAdmin =
    !authLoading &&
    !!mainUser &&
    (mainUser.role === "super_admin" || mainUser.role === "SUPER_ADMIN");

  const saUser: SuperAdminUser | null = isSuperAdmin
    ? { id: mainUser!.id, email: mainUser!.email, role: mainUser!.role }
    : null;

  // Legacy login() kept for backward compatibility with super-admin login page
  // that may still call it — it's now a no-op since auth is cookie-based
  const login = (_token: string, _user: SuperAdminUser) => {
    // Auth is handled by the main HttpOnly cookie — nothing to store
    toast.success("Welcome to Super Admin Control Center");
  };

  const logout = async () => {
    // Clear impersonation
    setActiveImpersonation(null);
    localStorage.removeItem("super_admin_impersonation");
    // Also clear legacy sa_token if it exists
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_user");
    // Logout from the main auth (clears HttpOnly cookie via backend)
    await mainLogout();
    toast.success("Logged out successfully");
  };

  const impersonateSchool = (id: string, name: string) => {
    const session: ImpersonationSession = { schoolId: id, schoolName: name, role: "admin" };
    setActiveImpersonation(session);
    localStorage.setItem("super_admin_impersonation", JSON.stringify(session));
    toast.success("Impersonation Session Active", {
      description: `You are now logged in as School Admin for ${name}.`,
    });
  };

  const exitImpersonation = () => {
    setActiveImpersonation(null);
    localStorage.removeItem("super_admin_impersonation");
    toast.success("Exited Session", {
      description: "Restored global super admin context.",
    });
    window.location.href = "/super-admin";
  };

  return (
    <SuperAdminContext.Provider
      value={{
        user: saUser,
        isAuthenticated: isSuperAdmin,
        isLoading: authLoading,
        activeImpersonation,
        login,
        logout,
        impersonateSchool,
        exitImpersonation,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  return ctx;
}
