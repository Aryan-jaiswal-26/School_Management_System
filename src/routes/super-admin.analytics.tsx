import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-ui";
import { SuperAdminAPI } from "@/services/super-admin.service";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieChartIcon,
  Award,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/super-admin/analytics")({
  component: SuperAdminAnalytics,
});

const ROLE_COLORS = [
  "oklch(0.55 0.13 255)", // Student
  "oklch(0.65 0.15 155)", // Parent
  "oklch(0.75 0.15 75)",  // Teacher
  "oklch(0.58 0.22 27)",  // Driver
  "oklch(0.65 0.13 230)", // Accountant
  "oklch(0.6 0.118 184.704)", // Admin
];

function SuperAdminAnalytics() {
  // Query Filters & Pagination State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [plan, setPlan] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Fetch Detailed Analytics
  const { data: analyticsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["superAdmin", "detailedAnalytics", { page, search, status, plan, sortBy, sortOrder }],
    queryFn: () =>
      SuperAdminAPI.getDetailedAnalytics({
        page,
        limit: 5,
        search,
        status: status !== "ALL" ? status : undefined,
        plan: plan !== "ALL" ? plan : undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Handle Export Downloads
  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setIsExporting(format);
      const data = await SuperAdminAPI.exportAnalytics({
        search,
        status: status !== "ALL" ? status : undefined,
        plan: plan !== "ALL" ? plan : undefined,
        format,
      });

      const blob = new Blob([data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `schools_analytics_${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export school analytics:", err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPlan("ALL");
    setPage(1);
    setSortBy("name");
    setSortOrder("asc");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-10 w-10 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-border">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Failed to load platform analytics</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Please verify database connectivity and try again.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold shadow-sm hover:opacity-90 transition-all"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const {
    kpis = { dau: 0, mau: 0, totalActiveSchools: 0, userGrowth: 0, avgEngagementScore: 0, avgChurnRate: 0 },
    revenueAnalytics = { totalRevenue: 0, mrr: 0, revenueTrend: [] },
    dauTrend = [],
    mauTrend = [],
    churnRateTrend = [],
    userRoleDistribution = [],
    topPerformingSchools = [],
    lowPerformingSchools = [],
    schoolsAnalytics = { data: [], total: 0, page: 1, limit: 5, totalPages: 1 },
  } = analyticsData.data || analyticsData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Platform Analytics Hub"
          description="Real-time usage insights, subscription trends, financial metrics, and tenant performance."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={!!isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-semibold shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting === "pdf" ? "Exporting..." : "PDF Report"}
          </button>
          <button
            onClick={() => handleExport("excel")}
            disabled={!!isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-semibold shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting === "excel" ? "Exporting..." : "Excel Report"}
          </button>
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Active Users</h3>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 rounded-lg">
              <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.dau.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Logins in past 24h</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Active Users</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-lg">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.mau.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Unique active in 30d</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Schools</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.totalActiveSchools}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Active platform tenants</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Growth</h3>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold">{(kpis.userGrowth >= 0 ? "+" : "") + kpis.userGrowth}%</span>
            {kpis.userGrowth >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500 self-center" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-500 self-center" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Month over month growth</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engagement Score</h3>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/40 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.avgEngagementScore}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Average user participation</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Churn Rate</h3>
            <div className="p-2 bg-rose-100 dark:bg-rose-950/40 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpis.avgChurnRate}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Sub cancellations (30d)</p>
        </div>
      </div>

      {/* Charts section 1: DAU & MAU Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAU Area Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Daily Active Users (DAU) Trend</h3>
          <p className="text-sm text-muted-foreground mb-6">Active sessions mapped over the last 30 days</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dauTrend}>
                <defs>
                  <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                <Area type="monotone" dataKey="users" stroke="oklch(0.55 0.13 255)" strokeWidth={3} fillOpacity={1} fill="url(#colorDau)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MAU Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Monthly Active Users (MAU) Trend</h3>
          <p className="text-sm text-muted-foreground mb-6">Unique active user metrics over the last 6 months</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mauTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                <Bar dataKey="users" fill="oklch(0.65 0.13 230)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts section 2: Revenue Trend & Churn Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold">Revenue Analytics</h3>
              <p className="text-sm text-muted-foreground">Monthly Recurring Revenue (MRR) & Trend</p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Total Revenue</span>
                <span className="text-xl font-extrabold text-emerald-600">${revenueAnalytics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Platform MRR</span>
                <span className="text-xl font-extrabold text-indigo-600">${revenueAnalytics.mrr.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueAnalytics.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, "Revenue"]} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.65 0.15 155)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Trend Line Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold">Platform Churn Trend</h3>
          <p className="text-sm text-muted-foreground mb-6">Percentage rate of subscription cancellations over time</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnRateTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: "12px", fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Churn Rate"]} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                <Line type="monotone" dataKey="rate" stroke="oklch(0.58 0.22 27)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role distribution & Top/Low Performing Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Role Distribution */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold">Role Distribution</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">User accounts across all schools</p>
          <div className="h-60 w-full flex items-center justify-center">
            {userRoleDistribution.length === 0 ? (
              <div className="text-sm text-muted-foreground">No roles configured.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="role"
                  >
                    {userRoleDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {userRoleDistribution.map((item: any, idx: number) => (
              <div key={item.role} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[idx % ROLE_COLORS.length] }}
                />
                <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                  {item.role}: {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Schools */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold">Top Performing Tenants</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Schools showing the highest platform engagement</p>
          <div className="space-y-4 flex-grow">
            {topPerformingSchools.map((school: any, idx: number) => (
              <div key={school.schoolCode} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{school.schoolName}</span>
                  <span className="text-xs text-muted-foreground">Code: {school.schoolCode} · Users: {school.totalUsers}</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                    {school.engagementScore}% Engaged
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Performing / Churn Risk Schools */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold">High Churn Risk Tenants</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Schools showing low engagement (potential churn)</p>
          <div className="space-y-4 flex-grow">
            {lowPerformingSchools.map((school: any, idx: number) => (
              <div key={school.schoolCode} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">{school.schoolName}</span>
                  <span className="text-xs text-muted-foreground">Code: {school.schoolCode} · Users: {school.totalUsers}</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                    {school.engagementScore}% Engaged
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* School-wise Analytics Table Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold">Tenant Analytics Directory</h3>
            <p className="text-sm text-muted-foreground">Analyze individual school usage, subscriptions, and financial metrics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search school name/code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            
            {/* Filters */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE_TRIAL">Trial Plan</option>
              <option value="BASIC">Basic Plan</option>
              <option value="STANDARD">Standard Plan</option>
              <option value="PREMIUM">Premium Plan</option>
              <option value="ENTERPRISE">Enterprise Plan</option>
            </select>

            {(search || status !== "ALL" || plan !== "ALL") && (
              <button
                onClick={handleResetFilters}
                className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  School Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("code")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  Code {sortBy === "code" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("totalUsers")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  Total Users {sortBy === "totalUsers" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("activeUsers30d")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  Active Users (30d) {sortBy === "activeUsers30d" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("engagementScore")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  Engagement Score {sortBy === "engagementScore" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plan & Subscription
                </th>
                <th
                  onClick={() => handleSort("revenue")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  Total Revenue {sortBy === "revenue" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {schoolsAnalytics.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                schoolsAnalytics.data.map((school: any) => (
                  <tr key={school.schoolId} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                      {school.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {school.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                      {school.totalUsers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {school.activeUsers30d}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-10 text-right text-xs font-semibold">{school.engagementScore}%</span>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              school.engagementScore > 70
                                ? "bg-emerald-500"
                                : school.engagementScore > 40
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${school.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {school.subscriptionPlan}
                      </span>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          school.subscriptionStatus === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                        }`}
                      >
                        {school.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-200">
                      ${school.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          school.status === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                            : school.status === "SUSPENDED"
                            ? "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                        }`}
                      >
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {schoolsAnalytics.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              Showing Page {schoolsAnalytics.page} of {schoolsAnalytics.totalPages} ({schoolsAnalytics.total} schools total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: schoolsAnalytics.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs font-bold border rounded-lg transition-colors ${
                    page === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(schoolsAnalytics.totalPages, p + 1))}
                disabled={page === schoolsAnalytics.totalPages}
                className="p-1 border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
