import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { TrendingUp, Users, GraduationCap, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // apiClient unwraps the "data" from the response object
        const res = await apiClient<any>("/analytics/dashboard");
        setData(res);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    );
  }

  if (!data) return <div>Failed to load data.</div>;

  const { core, gradePerf, monthly, deptDist, keyMetrics } = data;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Campus-wide insights and trends" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Enrollment Growth"
          value={core?.enrollmentGrowth || "+8.8%"}
          delta="YoY"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard label="Avg Attendance" value={core?.avgAttendance || "91.2%"} icon={Users} tone="info" />
        <StatCard label="Academic Avg" value={core?.academicAvg || "78.4%"} icon={GraduationCap} />
        <StatCard
          label="Fee Collection"
          value={core?.feeCollection || "78%"}
          delta="Of annual target"
          icon={Wallet}
          tone="success"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Grade-wise Performance"
          action={<span className="text-xs text-muted-foreground">Pre-final avg</span>}
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={gradePerf}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis
                  dataKey="g"
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
        <Panel
          title="Enrollment & Fee Trend"
          action={<span className="text-xs text-muted-foreground">6 months</span>}
        >
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis
                  dataKey="m"
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
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="oklch(0.55 0.13 255)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="fees"
                  stroke="oklch(0.65 0.15 155)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Staff Distribution">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deptDist}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {deptDist.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {deptDist.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Key Metrics Summary">
          <div className="space-y-3">
            {keyMetrics?.map((m: any) => (
              <div key={m.label} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${m.bar}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
