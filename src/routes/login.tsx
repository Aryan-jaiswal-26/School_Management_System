import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, getRolePath } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In · Campus OS" },
      { name: "description", content: "Sign in to your Campus OS account" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, user, authLoading, isMockMode, launchSuperAdminDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate({ to: getRolePath(user.role, user.schoolId) });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-6 h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        toast.success("Welcome back!", { description: "Signed in successfully." });
        navigate({ to: getRolePath(result.user.role, result.user.schoolId) });
      } else if (result.success) {
        toast.success("Welcome back!", { description: "Signed in successfully." });
      } else {
        setError(result.error || "Login failed");
        toast.error("Sign in failed", { description: result.error });
      }
    } catch {
      const message = "Unable to reach the authentication service. Check your connection.";
      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-[oklch(0.18_0.07_265)] via-[oklch(0.24_0.08_265)] to-[oklch(0.32_0.09_255)] p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Campus OS</div>
              <div className="text-sm text-white/60">School Management Suite</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            One platform for the <span className="text-blue-300">entire campus</span>
          </h1>
          <p className="mt-4 leading-relaxed text-white/70">
            Manage admissions, attendance, fees, hostel, library, transport, and communications —
            all from a single dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Admins", "Teachers", "Students"].map((r) => (
              <div
                key={r}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Campus OS</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
          {/* <p className="mt-1 text-sm text-muted-foreground">
            Demo mode — quick access password:{" "}
            <span className="font-medium text-foreground">{isMockMode ? "123" : "password123"}</span>
          </p> */}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-12 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <button
              onClick={() => navigate({ to: "/register" })}
              className="font-semibold text-accent hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </div>

          <div className="mt-8 space-y-2">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await launchSuperAdminDemo();
                  if (res && !res.success) {
                    toast.error("Failed to launch Super Admin Control Center", { description: res.error });
                  } else {
                    toast.success("Welcome to Super Admin Control Center");
                    navigate({ to: "/super-admin" });
                  }
                } catch (err) {
                  toast.error("Failed to connect to authentication server");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-indigo-500/10 p-3 text-xs font-bold text-rose-500 shadow-sm transition-all hover:border-rose-500/50 hover:bg-rose-500/15 active:scale-[0.99] cursor-pointer"
            >
              <Shield className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
              <span>✨ Launch Super Admin Control Center</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/register" })}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-pink-500/10 p-3 text-xs font-bold text-indigo-500 shadow-sm transition-all hover:border-indigo-500/50 hover:bg-indigo-500/15 active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              <span>📝 Enrolls Portal / Register Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
