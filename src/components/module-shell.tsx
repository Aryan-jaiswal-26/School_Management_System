import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronLeft, LogOut, X, GraduationCap, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageContent } from "@/components/page-ui";
import { BranchSelector } from "@/components/BranchSelector";

export type NavGroup = {
  label: string;
  items: { to: string; label: string; icon: LucideIcon }[];
};

interface ModuleShellProps {
  brand: string;
  roleLabel: string;
  groups: NavGroup[];
  children: ReactNode;
}

function pathMatchesItem(pathname: string, itemTo: string) {
  if (pathname === itemTo) return true;
  if (itemTo === "/") return false;
  return pathname.startsWith(itemTo + "/");
}

export function ModuleShell({ brand, roleLabel, groups, children }: ModuleShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const allNavTos = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.to)), [groups]);
  const activeTo = useMemo(() => {
    const matches = allNavTos.filter((to) => pathMatchesItem(pathname, to));
    if (matches.length === 0) return null;
    return matches.reduce((best, to) => (to.length > best.length ? to : best), matches[0]!);
  }, [allNavTos, pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Signed out", { description: "You have been signed out successfully." });
      navigate({ to: "/login" });
    } catch {
      toast.error("Sign out failed", {
        description: "Could not end your session. Please try again.",
      });
    }
  };

  const displayUser = user ?? { name: "Guest", sub: "", initials: "G" };

  const sidebarContent = (showClose: boolean) => (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sidebar-primary to-accent text-sidebar-primary-foreground shadow-md">
          <GraduationCap className="h-5 w-5" />
        </div>
        {(!collapsed || showClose) && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{brand}</div>
            <div className="truncate text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              {roleLabel}
            </div>
          </div>
        )}
        {showClose && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            {(!collapsed || showClose) && (
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === activeTo;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && !showClose && "justify-center",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {(!collapsed || showClose) && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-2",
            collapsed && !showClose && "justify-center",
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-primary/30 text-sm font-semibold ring-2 ring-sidebar-primary/40">
            {displayUser.initials}
          </div>
          {(!collapsed || showClose) && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{displayUser.name}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{displayUser.sub}</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          id="sign-out-btn"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-red-500/15 hover:text-red-300",
            collapsed && !showClose && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || showClose) && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,17rem)] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent(true)}
      </aside>

      <aside
        className={cn(
          "sticky top-0 hidden md:flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {sidebarContent(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-header sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-border px-3 sm:px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>

          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search campus…"
              className="h-9 w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <span className="ml-auto hidden rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent sm:inline-flex">
            {roleLabel}
          </span>

          <BranchSelector />

          <button
            type="button"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          </button>
        </header>

        <main className="page-mesh flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 pb-20 md:pb-6">
          <PageContent>{children}</PageContent>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/90 px-4 pb-safe backdrop-blur-lg md:hidden">
          {groups[0]?.items.slice(0, 4).map((item) => {
            const active = item.to === activeTo;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors",
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneMap = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    info: "bg-accent/10 text-accent",
  } as const;
  return (
    <div className="group rounded-2xl border border-border/80 bg-card p-5 transition-all hover:scale-[1.01] hover:border-accent/30 focus-within:ring-2 focus-within:ring-accent/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {delta && <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>}
        </div>
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform group-hover:rotate-6",
            toneMap[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-5 transition-all hover:border-accent/15",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-14 px-6 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
