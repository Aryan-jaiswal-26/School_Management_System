import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  Wallet,
  Building2,
  Bus,
  BookOpen,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function formatCurrency(amount: number) {
  if (!amount) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient<any>("/analytics/dashboard");
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        if (isMounted) {
          setError("Unable to load the live dashboard right now. Please refresh or try again shortly.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
        <div className="text-sm text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-destructive">Dashboard unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    totalStudents,
    totalStaff,
    collectedFees,
    pendingDues,
    pendingDuesStudentsCount,
    hostelOccupancy,
    libraryBooksOut,
    busesOnRoute,
    core,
    monthly,
    deptDist,
    feeData,
    attendanceData,
    activity,
  } = data;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Live overview of campus operations · Academic Year ${new Date().getFullYear() - 1}–${new Date().getFullYear().toString().slice(-2)}`}
        actions={
          <>
            <Link
              to="/admin/branding"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Branding
            </Link>
            <Link
              to="/admin/school"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open School Setup
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={(totalStudents ?? 0).toString()}
          delta="Enrolled"
          icon={GraduationCap}
          tone="info"
        />
        <StatCard 
          label="Total Staff" 
          value={(totalStaff ?? 0).toString()} 
          delta="Active" 
          icon={Users} 
        />
        <StatCard
          label="Fees Collected"
          value={formatCurrency(collectedFees ?? 0)}
          delta={`${core?.feeCollection || "0%"} of target`}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Pending Dues"
          value={formatCurrency(pendingDues ?? 0)}
          delta={`${pendingDuesStudentsCount ?? 0} students`}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Admissions trend"
            action={<span className="text-xs text-muted-foreground">Last 6 months</span>}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.015 255)" vertical={false} />
                  <XAxis dataKey="m" stroke="oklch(0.50 0.03 260)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.50 0.03 260)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="new" name="New Enrollments" stroke="oklch(0.55 0.13 255)" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel
          title="Fee status"
          action={<span className="text-xs text-muted-foreground">This term</span>}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {feeData?.map((f: any) => (
                    <Cell key={f.name} fill={f.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {feeData?.map((f: any) => (
              <li key={f.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </span>
                <span className="font-medium">{f.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Weekly attendance">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.015 255)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.50 0.03 260)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="oklch(0.50 0.03 260)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="present" name="Attendance %" fill="oklch(0.65 0.15 155)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Operations snapshot">
          <ul className="space-y-3 text-sm">
            {[
              { icon: Building2, label: "Hostel occupancy", value: `${hostelOccupancy ?? 0}%` },
              { icon: Bus, label: "Buses on route", value: busesOnRoute ?? "0 / 0" },
              { icon: BookOpen, label: "Library books out", value: (libraryBooksOut ?? 0).toLocaleString() },
              { icon: TrendingUp, label: "Avg academic score", value: core?.academicAvg || "0%" },
            ].map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="flex items-center gap-3 text-foreground">
                  <r.icon className="h-4 w-4 text-accent" />
                  {r.label}
                </span>
                <span className="font-semibold">{r.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent activity"
          action={<button className="text-xs text-accent hover:underline">View all</button>}
        >
          <ul className="space-y-3">
            {activity?.length ? (
              activity.map((a: any, i: number) => (
                <li
                  key={i}
                  className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {a.tag}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No recent activity is available yet from the live database.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
