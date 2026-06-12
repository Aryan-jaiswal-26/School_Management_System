import { createFileRoute } from "@tanstack/react-router";
import { Users, ClipboardCheck, FileText, MessageSquare, TrendingUp, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/teacher/")({
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeacherAnalytics() {
      try {
        const res = await apiClient<any>("/analytics/teacher-dashboard");
        setData(res || {});
      } catch (err) {
        console.error("Failed to load teacher analytics", err);
        setData({});
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!data) return <div>Failed to load data.</div>;

  const { core, classPerf, submissions, schedule, inbox } = data;

  return (
    <div>
      <PageHeader
        title="Welcome back, Teacher"
        subtitle={`${core?.todaysClasses || 0} classes today · ${core?.assignmentsToGrade || 0} assignments to grade`}
        actions={
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Take attendance
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={core?.totalStudents?.toString() || "0"}
          delta="Across active classes"
          icon={Users}
          tone="info"
        />
        <StatCard label="Today's classes" value={core?.todaysClasses?.toString() || "0"} delta="Scheduled for today" icon={Clock} />
        <StatCard
          label="Assignments to grade"
          value={core?.assignmentsToGrade?.toString() || "0"}
          delta="Pending grading"
          icon={FileText}
          tone="warning"
        />
        <StatCard
          label="Class avg score"
          value={core?.classAvgScore || "-"}
          delta="Current average"
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Class performance"
            action={<span className="text-xs text-muted-foreground">Pre-final exam</span>}
          >
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={classPerf}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.91 0.015 255)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="cls"
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[60, 100]}
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="avg" fill="oklch(0.55 0.13 255)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel
          title="Submissions"
          action={<span className="text-xs text-muted-foreground">6 weeks</span>}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={submissions}>
                <defs>
                  <linearGradient id="ton" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.15 155)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.15 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  stroke="oklch(0.50 0.03 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.50 0.03 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Area dataKey="on" stroke="oklch(0.55 0.15 155)" fill="url(#ton)" strokeWidth={2} />
                <Area
                  dataKey="late"
                  stroke="oklch(0.75 0.15 75)"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Today's schedule"
            action={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
          >
            <ul className="divide-y divide-border">
              {schedule?.map((s: any, idx: number) => (
                <li key={`${s.time}-${idx}`} className="flex items-center gap-4 py-3">
                  <div className="w-16 shrink-0 text-sm font-semibold text-accent">{s.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      Class {s.cls} · {s.topic}
                    </div>
                    <div className="text-xs text-muted-foreground">Room {s.room}</div>
                  </div>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    Mark attendance
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Inbox" action={<MessageSquare className="h-4 w-4 text-muted-foreground" />}>
          <ul className="space-y-3">
            {inbox?.map((m: any, i: number) => (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{m.from}</span>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                  {m.unread && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  <span className="truncate">{m.subject}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
