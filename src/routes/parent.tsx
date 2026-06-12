import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Bell,
  Bus,
  GraduationCap,
  Wallet,
  User,
  Users,
  Volume2,
  MessageSquare,
  CreditCard,
  Settings,
  HeartHandshake
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath } from "@/lib/auth-context";
import { fetchParentDashboard } from "@/lib/parent-api";

const groups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { to: "/parent", label: "Dashboard", icon: LayoutDashboard },
      { to: "/parent/notifications", label: "Alerts & Support", icon: Bell },
    ],
  },
  {
    label: "Safety & Logistics",
    items: [{ to: "/parent/transport", label: "Live Bus Tracking", icon: Bus }],
  },
  {
    label: "Learning & Oversight",
    items: [{ to: "/parent/academics", label: "Academic Oversight", icon: GraduationCap }],
  },
  {
    label: "Communication",
    items: [
      { to: "/parent/communication", label: "Teachers & Leaves", icon: MessageSquare },
      { to: "/parent/community", label: "Community & Feedback", icon: HeartHandshake },
    ],
  },
  {
    label: "Account & Wallet",
    items: [
      { to: "/parent/fees", label: "Fee Ledger & Invoicing", icon: Wallet },
      { to: "/parent/canteen", label: "Canteen Smart Wallet", icon: CreditCard },
      { to: "/parent/profile", label: "Profile & Settings", icon: Settings },
    ],
  },
];

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "Parent Workspace · Campus OS" }] }),
  component: ParentLayout,
});

function ParentLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeChild, setActiveChild] = useState<string>("");
  const [childrenList, setChildrenList] = useState<{key: string, name: string, className: string}[]>([]);

  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await fetchParentDashboard();
        if (res.children && Object.keys(res.children).length > 0) {
          const list = Object.keys(res.children).map(key => ({
            key,
            name: res.children[key].name,
            className: res.children[key].className || ""
          }));
          setChildrenList(list);
          const stored = localStorage.getItem("parent_active_child");
          if (stored && res.children[stored]) {
            setActiveChild(stored);
            localStorage.setItem("parent_active_child_name", res.children[stored].name);
          } else {
            setActiveChild(list[0].key);
            localStorage.setItem("parent_active_child_name", list[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load children in layout", err);
      }
    }
    if (isAuthenticated && user?.role === "parent") {
      loadChildren();
    }
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    } else if (user?.role !== "parent") {
      navigate({ to: getRolePath(user!.role, user?.schoolId) });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Sync active child state across tabs via localStorage
  useEffect(() => {
    localStorage.setItem("parent_active_child", activeChild);
    // Fire a custom event so other components know it changed
    window.dispatchEvent(new Event("activeChildChanged"));
  }, [activeChild]);

  if (authLoading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "parent") return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic Sibling Switcher Header */}
      <div className="bg-card border-b border-border px-6 py-2.5 flex items-center justify-between text-sm shadow-sm z-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 text-accent" />
          <span className="font-semibold text-foreground">Parent Control Panel</span>
          <span className="text-xs">·</span>
          <span>Linked Sibling Profiles:</span>
        </div>
        <div className="flex gap-1.5 bg-muted p-0.5 rounded-lg border border-border">
          {childrenList.map((child) => (
            <button
              key={child.key}
              onClick={() => {
                setActiveChild(child.key);
                localStorage.setItem("parent_active_child_name", child.name);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeChild === child.key
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3 w-3" />
              {child.name} {child.className ? `(${child.className})` : ""}
            </button>
          ))}
          {childrenList.length === 0 && (
            <span className="px-3 py-1 text-xs text-muted-foreground">No students linked</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ModuleShell brand="Campus OS" roleLabel="Parent / Guardian" groups={groups}>
          <Outlet />
        </ModuleShell>
      </div>
    </div>
  );
}
