import { createFileRoute, Outlet, Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Sliders,
  Megaphone,
  LogOut,
  ChevronLeft,
  X,
  Bell,
  Search,
  UserCheck,
  CreditCard,
  BarChart,
  LifeBuoy,
  Send,
  FileText,
  Settings,
  ToggleRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SuperAdminProvider, useSuperAdmin } from "@/components/super-admin/super-admin-context";
import { Toaster } from "sonner";
import { PageContent } from "@/components/page-ui";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Super Admin Control Center · Campus OS" }] }),
  component: SuperAdminLayoutWrapper,
});

function SuperAdminLayoutWrapper() {
  return (
    <SuperAdminProvider>
      <SuperAdminLayout />
    </SuperAdminProvider>
  );
}

const menuGroups = [
  {
    label: "Platform",
    items: [
      {
        to: "/super-admin",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        to: "/super-admin/schools",
        label: "School Management",
        icon: Building2,
      },
      {
        to: "/super-admin/features",
        label: "Feature Toggles",
        icon: ToggleRight,
      },
    ],
  },
  {
    label: "Monetization",
    items: [
      {
        to: "/super-admin/subscriptions",
        label: "Subscription Plans",
        icon: Sliders,
      },
      {
        to: "/super-admin/billing",
        label: "Billing & Payments",
        icon: CreditCard,
      },
      {
        to: "/super-admin/analytics",
        label: "Analytics",
        icon: BarChart,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        to: "/super-admin/announcements",
        label: "Announcements",
        icon: Megaphone,
      },
      {
        to: "/super-admin/notifications",
        label: "Push Notifications",
        icon: Send,
      },
      {
        to: "/super-admin/support",
        label: "Support Tickets",
        icon: LifeBuoy,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        to: "/super-admin/cms",
        label: "CMS",
        icon: FileText,
      },
      {
        to: "/super-admin/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

const allNavTos = menuGroups.flatMap((g) => g.items.map((i) => i.to));

function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const { activeImpersonation, exitImpersonation, isAuthenticated, isLoading, logout } = useSuperAdmin();

  const activeTo = useMemo(() => {
    const matches = allNavTos.filter((to) => {
      if (pathname === to) return true;
      if (to === "/super-admin") return pathname === "/super-admin" || pathname === "/super-admin/";
      return pathname.startsWith(to + "/");
    });
    if (matches.length === 0) return null;
    return matches.reduce((best, to) => (to.length > best.length ? to : best), matches[0]!);
  }, [pathname]);

  // Redirect to main login if not authenticated as super_admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }



  const sidebarContent = (showClose: boolean) => (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-accent text-sidebar-primary-foreground shadow-md ring-2 ring-indigo-400/25">
          <ShieldAlert className="h-5 w-5 text-accent-foreground" />
        </div>
        {(!collapsed || showClose) && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight text-white">
              Campus OS
            </div>
            <div className="truncate text-[10px] font-bold tracking-wider text-rose-400 uppercase">
              Super Administrator
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

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {(!collapsed || showClose) && (
              <div className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/45">
                {group.label}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.to === activeTo;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-500/20"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white",
                        collapsed && !showClose && "justify-center",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
                          active ? "scale-110" : "group-hover:scale-110",
                        )}
                      />
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
            "flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-2.5 border border-sidebar-border/30",
            collapsed && !showClose && "justify-center",
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-sm font-bold text-white ring-2 ring-indigo-500/20">
            SA
          </div>
          {(!collapsed || showClose) && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">System Controller</div>
              <div className="truncate text-[11px] text-sidebar-foreground/50">
                global.admin@campus.os
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-all hover:bg-red-500/10 hover:text-red-400",
            collapsed && !showClose && "justify-center",
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {(!collapsed || showClose) && <span>Exit Portal</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* ── IMPERSONATION BANNER ── */}
      {activeImpersonation && (
        <div className="sticky top-0 z-50 flex w-full animate-in slide-in-from-top duration-300 items-center justify-between border-b border-rose-500/30 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 px-4 py-2 text-rose-100 shadow-md">
          <div className="flex flex-1 items-center justify-center gap-2 sm:gap-3 text-center">
            <UserCheck className="h-4.5 w-4.5 text-rose-400 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-medium tracking-tight">
              Currently impersonating{" "}
              <strong className="text-white font-bold">{activeImpersonation.schoolName}</strong> as{" "}
              <span className="font-semibold text-rose-300">School Admin</span>
            </span>
          </div>
          <button
            type="button"
            onClick={exitImpersonation}
            className="flex items-center gap-1.5 rounded-md bg-rose-700/80 px-2.5 py-1 text-xs font-bold text-white transition-all hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer shadow-sm ml-2"
          >
            Exit Session
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 w-full">
        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent(true)}
        </aside>

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden md:flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
            collapsed ? "w-[72px]" : "w-64",
          )}
        >
          {sidebarContent(false)}
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="glass-header sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-border px-3 sm:px-4 md:px-6">
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
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  collapsed && "rotate-180",
                )}
              />
            </button>

            <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Audit platform query..."
                className="h-9 w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 text-sm shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                Root Controller
              </span>

              <button
                type="button"
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted cursor-pointer"
                aria-label="Alerts"
              >
                <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-card" />
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="page-mesh flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 overflow-y-auto">
            <PageContent>
              <Outlet />
            </PageContent>
          </main>
        </div>
      </div>
    </div>
  );
}
