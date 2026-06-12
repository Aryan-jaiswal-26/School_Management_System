import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, getRolePath } from "@/lib/auth-context";
import { useEffect } from "react";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user) {
      navigate({ to: getRolePath(user.role, user.schoolId) });
    } else {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  return (
    <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-foreground">Campus OS</div>
          <div className="text-sm text-muted-foreground">Loading your workspace…</div>
        </div>
      </div>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
    </div>
  );
}
