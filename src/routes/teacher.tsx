import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Newspaper,
  User,
  ClipboardCheck,
  BookOpen,
  FileText,
  BarChart3,
  MessageSquare,
  LifeBuoy,
  CalendarDays,
  Wallet,
  Brain,
  Video,
  Users,
  BookOpenCheck,
  Star,
  WalletCards,
  HelpCircle,
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath } from "@/lib/auth-context";

const groups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
      { to: "/teacher/timetable", label: "My Timetable", icon: CalendarDays },
      { to: "/teacher/feed", label: "Feed", icon: Newspaper },
      { to: "/teacher/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Classroom",
    items: [
      { to: "/teacher/students", label: "My Students", icon: Users },
      { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/teacher/lesson-plans", label: "Lesson Plans", icon: BookOpenCheck },
      { to: "/teacher/syllabus", label: "Syllabus", icon: BookOpen },
      { to: "/teacher/assignments", label: "Assignments", icon: FileText },
      { to: "/teacher/materials", label: "Study materials", icon: FileText },
      { to: "/teacher/quizzes", label: "Polls & Quizzes", icon: HelpCircle },
      { to: "/teacher/behavior", label: "Behavior & Rewards", icon: Star },
      { to: "/teacher/live-class", label: "Live Virtual Class", icon: Video },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/teacher/exams", label: "Exam insights", icon: BarChart3 },
      { to: "/teacher/reports", label: "Student reports", icon: BarChart3 },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/teacher/messages", label: "SMS · Email · Notices", icon: MessageSquare },
      { to: "/teacher/support", label: "Tickets & Support", icon: LifeBuoy },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/teacher/payroll", label: "Payslips & Salary", icon: WalletCards },
      { to: "/teacher/leave", label: "Leave & permissions", icon: CalendarDays },

    ],
  },
  { label: "AI Hub", items: [{ to: "/teacher/ai-hub", label: "AI Tools", icon: Brain }] },
];

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Workspace · Campus OS" }] }),
  component: TeacherLayout,
});

function TeacherLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: "/login" });
    else if (user?.role !== "teacher") navigate({ to: getRolePath(user!.role, user?.schoolId) });
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "teacher") return null;

  return (
    <ModuleShell brand="Campus OS" roleLabel="Teacher" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
