import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/page-ui";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";

export const Route = createFileRoute("/super-admin/")({
  component: SuperAdminDashboard,
});

function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

function SuperAdminDashboard() {
  const { data: metricsData, isLoading, isError } = useQuery({
    queryKey: ["superAdmin", "dashboard"],
    queryFn: SuperAdminAPI.getDashboardMetrics,
  });

  const { data: plansData } = useQuery({
    queryKey: ["superAdmin", "plans"],
    queryFn: SuperAdminAPI.getPlans,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !metricsData) {
    return (
      <div className="p-8 text-red-500">
        Failed to load dashboard metrics. Please refresh the page.
      </div>
    );
  }

  const metrics = metricsData.data || metricsData;

  const revenueData = metrics.revenueData?.length
    ? metrics.revenueData
    : [{ name: "-", revenue: 0 }];

  const growthData = metrics.growthData?.length
    ? metrics.growthData
    : [{ name: "-", schools: 0 }];

  const recentActivities: Array<{ id: string; action: string; school: string; time: string | Date }> =
    metrics.recentActivities || [];

  const plans: any[] = plansData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Dashboard"
        description="Overview of platform performance, growth, and key metrics."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Schools</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.totalSchools ?? 0}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {metrics.activeSchools ?? 0} Active · {metrics.suspendedSchools ?? 0} Suspended
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              ${(metrics.monthlyRevenue ?? metrics.mrr ?? 0).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Total platform MRR</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.totalUsers ?? 0}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Across all schools</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Support Tickets</h3>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{metrics.openTickets ?? 0}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Open tickets requiring attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`$${value}`, "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">School Growth Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [value, "Schools"]}
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="schools" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Summary - Dynamic from plans */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
          {plans.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No subscription plans configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan: any) => (
                <div
                  key={plan._id}
                  className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-200 block">
                      {plan.name}
                    </span>
                    <span className="text-xs text-slate-400">{plan.code} · {plan.billingCycle}</span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    ${plan.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities - Dynamic from AuditLog */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Platform Activities</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {recentActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      No recent platform activities recorded.
                    </td>
                  </tr>
                ) : (
                  recentActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {activity.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {activity.school}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(activity.time)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
