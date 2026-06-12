import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Loader2,
  Calendar,
  User,
  Shield,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  History,
  Info,
  Laptop
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs · Campus OS" }] }),
  component: Page,
});

interface AuditLogEntry {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  action: string;
  module: string;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function Page() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Common Modules and Actions lists for filtering
  const modules = [
    { value: "AUTH", label: "Authentication" },
    { value: "STUDENT", label: "Students" },
    { value: "EMPLOYEE", label: "Employees" },
    { value: "FEE", label: "Fees & Finance" },
    { value: "CANTEEN", label: "Canteen" },
    { value: "HOSTEL", label: "Hostel" },
    { value: "LIBRARY", label: "Library" },
    { value: "BRANDING", label: "Branding" },
    { value: "SCHOOL", label: "School Settings" }
  ];

  const actions = [
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" }
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", "15");
      if (search) queryParams.append("search", search);
      if (moduleFilter) queryParams.append("module", moduleFilter);
      if (actionFilter) queryParams.append("action", actionFilter);

      const res: any = await apiClient(`/audit-logs?${queryParams.toString()}`);
      
      const logsData = res?.logs || [];
      const pagData = res?.pagination || null;

      setLogs(Array.isArray(logsData) ? logsData : []);
      setPagination(pagData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE")) return "bg-emerald-500/12 text-emerald-500 border-emerald-500/20";
    if (act.includes("DELETE")) return "bg-rose-500/12 text-rose-500 border-rose-500/20";
    if (act.includes("UPDATE")) return "bg-amber-500/12 text-amber-500 border-amber-500/20";
    if (act.includes("LOGIN") || act.includes("LOGOUT")) return "bg-blue-500/12 text-blue-500 border-blue-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const getUserRoleBadgeColor = (role?: string) => {
    if (!role) return "bg-muted text-muted-foreground";
    const r = role.toUpperCase();
    if (r.includes("ADMIN")) return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    if (r.includes("TEACHER")) return "bg-teal-500/10 text-teal-600 border-teal-500/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Track system changes, administrative actions, and logins to monitor security"
        actions={
          <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
            <History className="h-4 w-4" />
            Active Change Ledger
          </div>
        }
      />

      {/* Filter bar */}
      <Panel title="Filter Audit Logs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, module, or user email/name…"
              className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none cursor-pointer"
            >
              <option value="">All System Modules</option>
              {modules.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none cursor-pointer"
            >
              <option value="">All Actions</option>
              {actions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Panel>

      {/* Logs Table */}
      <Panel title="Logs Registry">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Module</th>
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4 hidden md:table-cell">IP Address</th>
                <th className="pb-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : logs.map((log) => {
                const userDisplayName = log.userId
                  ? `${log.userId.firstName} ${log.userId.lastName}`
                  : "System / Cron Process";
                const userEmail = log.userId?.email || "internal@system";
                
                return (
                  <tr key={log._id} className="border-b border-border/50 hover:bg-muted/40 last:border-0">
                    <td className="py-3.5 pr-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{userDisplayName}</span>
                        <span className="text-xs text-muted-foreground">{userEmail}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-semibold uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {log.ipAddress || "Internal"}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-all cursor-pointer"
                        title="View changes state"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No matching audit entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-muted cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Page {page} of {pagination.pages} ({pagination.total} entries)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
              disabled={page === pagination.pages}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-muted cursor-pointer"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </Panel>

      {/* Detail Changes Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Audit Log Event Details</h2>
                  <p className="text-xs text-muted-foreground">
                    Event Reference: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">{selectedLog._id}</code>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <User className="h-4 w-4" /> Operator Profile
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {selectedLog.userId ? `${selectedLog.userId.firstName} ${selectedLog.userId.lastName}` : "System Process"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedLog.userId?.email || "cron@server"}
                    </div>
                    {selectedLog.userId && (
                      <span className={`mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getUserRoleBadgeColor(selectedLog.userId.role)}`}>
                        {selectedLog.userId.role}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Shield className="h-4 w-4" /> System Action Details
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Module:</span>
                      <span className="font-bold text-foreground">{selectedLog.module}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Action Trigger:</span>
                      <span className="font-bold text-foreground">{selectedLog.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-semibold text-foreground">{selectedLog.ipAddress || "Internal"}</span>
                    </div>
                    {selectedLog.resourceId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resource ID:</span>
                        <span className="font-mono text-[10px] text-foreground font-semibold">{selectedLog.resourceId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Agent metadata */}
              {selectedLog.userAgent && (
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Laptop className="h-4 w-4" /> Client User Agent
                  </div>
                  <div className="text-xs text-muted-foreground font-mono break-all leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/50">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {/* JSON comparisons diff */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Layers className="h-4 w-4" /> State Changes Comparison (Before vs After)
                </div>

                {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before change block */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Original State (Before)
                      </div>
                      <pre className="p-3 bg-muted rounded-xl border border-border text-[11px] font-mono overflow-auto max-h-[320px] leading-relaxed text-foreground select-all">
                        {selectedLog.changes.before
                          ? JSON.stringify(selectedLog.changes.before, null, 2)
                          : "{} // Empty State (New Resource Created)"}
                      </pre>
                    </div>

                    {/* After change block */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Modified State (After)
                      </div>
                      <pre className="p-3 bg-muted rounded-xl border border-border text-[11px] font-mono overflow-auto max-h-[320px] leading-relaxed text-foreground select-all">
                        {selectedLog.changes.after
                          ? JSON.stringify(selectedLog.changes.after, null, 2)
                          : "{} // Empty State (Resource Deleted)"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/10 p-4 text-muted-foreground text-xs leading-relaxed">
                    <Info className="h-5 w-5 shrink-0 text-accent" />
                    <div>
                      No database state changes were logged for this event. This is typical for simple system activities, read operations, or logins/logouts.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
