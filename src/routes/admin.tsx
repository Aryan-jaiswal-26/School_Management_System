import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Wallet,
  Building2,
  UserCog,
  Library,
  Bus,
  MessageSquare,
  BarChart3,
  Brain,
  Package,
  Utensils,
  Activity,
  Settings,
  ShieldCheck,
  Dumbbell,
  Award,
  Calendar,
  ShieldAlert,
  UserCheck2,
  Scale,
  BookMarked,
  CalendarClock,
  Video,
  GitBranch,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath, isAdminPortalRole } from "@/lib/auth-context";

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/students", label: "Students", icon: GraduationCap },
      { to: "/admin/staff", label: "Staff", icon: Users },
      { to: "/admin/hr", label: "HR & Payroll", icon: UserCog },
      { to: "/admin/import", label: "Bulk Import", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/admin/academics", label: "Academics", icon: GraduationCap },
      { to: "/admin/exams", label: "Exams & Timetable", icon: CalendarDays },
      { to: "/admin/timetable", label: "Timetable Builder", icon: CalendarClock },
      { to: "/admin/ptm", label: "Parent-Teacher Meetings", icon: Video },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/fees", label: "Fees & Finance", icon: Wallet },
      { to: "/admin/hostel", label: "Hostel", icon: Building2 },
      { to: "/admin/library", label: "Library Management", icon: Library },
      { to: "/admin/transport", label: "Transport", icon: Bus },
      { to: "/admin/inventory", label: "Inventory", icon: Package },
      { to: "/admin/canteen", label: "Canteen & Mess", icon: Utensils },
      { to: "/admin/health", label: "Health Clinic", icon: Activity },
    ],
  },
  {
    label: "Specialist Modules",
    items: [
      { to: "/admin/sports", label: "Sports & Activities", icon: Dumbbell },
      { to: "/admin/visitors", label: "Visitor Management", icon: UserCheck2 },
      { to: "/admin/certificates", label: "Certificates & Awards", icon: Award },
      { to: "/admin/events", label: "Events & Culture", icon: Calendar },
      { to: "/admin/safety", label: "Safety & Emergency", icon: ShieldAlert },
      { to: "/admin/discipline", label: "Discipline Records", icon: Scale },
      { to: "/admin/alumni", label: "Alumni Directory", icon: BookMarked },
    ],
  },
  {
    label: "Communications",
    items: [{ to: "/admin/communications", label: "SMS · Mail · Notices", icon: MessageSquare }],
  },
  {
    label: "System",
    items: [
      { to: "/admin/school", label: "School Profile", icon: Building2 },
      { to: "/admin/branches", label: "Branch Management", icon: GitBranch },
      { to: "/admin/branding", label: "Branding", icon: Package },
      { to: "/admin/subscription", label: "Subscription & Billing", icon: Wallet },
      { to: "/admin/audit", label: "Audit Logs", icon: History },
      { to: "/admin/settings", label: "Settings", icon: Settings }
    ],
  },
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Workspace · Campus OS" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!isAdminPortalRole(user.role)) {
    return <Navigate to={getRolePath(user.role, user.schoolId)} />;
  }

  return (
    <ModuleShell brand="Campus OS" roleLabel="Administrator" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
