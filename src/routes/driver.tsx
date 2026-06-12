import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Bus,
  History,
  ShieldCheck
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath } from "@/lib/auth-context";

const groups: NavGroup[] = [
  {
    label: "Trip Management",
    items: [
      { to: "/driver", label: "Cockpit", icon: LayoutDashboard },
    ],
  },
];

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [{ title: "Driver Workspace · Campus OS" }] }),
  component: DriverLayout,
});

function DriverLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: "/login" });
    else if (user?.role !== "driver") navigate({ to: getRolePath(user!.role, user?.schoolId) });
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "driver") return null;

  return (
    <ModuleShell brand="Campus OS" roleLabel="Bus Driver" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
