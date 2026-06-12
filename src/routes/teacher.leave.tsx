import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Calendar, AlertCircle, FileText, CheckCircle, Clock, XCircle, Send } from "lucide-react";

export const Route = createFileRoute("/teacher/leave")({
  head: () => ({ meta: [{ title: "Leave & Permissions · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();

  // Form states
  const [type, setType] = useState("Casual Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [myLeaves, setMyLeaves] = useState<any[]>([]);

  const teacherName = user?.name || "Teacher";

  const loadLeaves = async () => {
    try {
      const res = await apiClient<any>("/leaves/my");
      setMyLeaves(res?.data || []);
    } catch {}
  };

  useEffect(() => { loadLeaves(); }, []);

  const stats = {
    casualTaken: myLeaves.filter((l: any) => (l.type || l.leaveType) === "Casual Leave" && l.status === "approved").length * 2,
    sickTaken: myLeaves.filter((l: any) => (l.type || l.leaveType) === "Sick Leave" && l.status === "approved").length * 3,
    pending: myLeaves.filter((l: any) => l.status === "pending").length,
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !reason.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await apiClient("/leaves", {
        method: "POST",
        data: {
          leaveType: type,
          startDate: from,
          endDate: to,
          reason,
        }
      });
      toast.success("Leave application submitted!", {
        description: "Your request is sent to the Principal for review.",
      });
      setFrom("");
      setTo("");
      setReason("");
      loadLeaves();
    } catch {
      toast.error("Failed to submit leave request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.65_0.15_155)]/10 px-2 py-0.5 text-xs font-medium text-[oklch(0.45_0.15_155)]">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.75_0.15_75)]/10 px-2 py-0.5 text-xs font-medium text-[oklch(0.50_0.15_75)]">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave & Permissions"
        subtitle="Apply for leave, track application status, and view leave balances."
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Casual Leave
            </span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{stats.casualTaken}</span>
            <span className="text-sm text-muted-foreground">/ 12 days taken</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(stats.casualTaken / 12) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sick Leave
            </span>
            <span className="rounded-lg bg-accent/10 p-2 text-accent">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{stats.sickTaken}</span>
            <span className="text-sm text-muted-foreground">/ 8 days taken</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${(stats.sickTaken / 8) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pending Requests
            </span>
            <span className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{stats.pending}</span>
            <span className="text-sm text-muted-foreground">awaiting decision</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: stats.pending > 0 ? "50%" : "0%" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leave application form */}
        <div className="lg:col-span-1">
          <Panel title="Apply for Leave">
            <form onSubmit={handleApply} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Leave Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Duty Leave</option>
                  <option>Maternity/Paternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">To Date</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Reason for Leave
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for leave..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
                Submit Application
              </button>
            </form>
          </Panel>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <Panel title="Leave Application History">
            {myLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">No applications yet</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submit your first leave request using the form.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-2 font-medium">Type</th>
                      <th className="py-3 px-2 font-medium">Dates</th>
                      <th className="py-3 px-2 font-medium">Applied On</th>
                      <th className="py-3 px-2 font-medium">Reason</th>
                      <th className="py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...myLeaves].reverse().map((leave: any) => (
                      <tr key={leave._id || leave.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 px-2 font-medium text-foreground">{leave.type || leave.leaveType}</td>
                        <td className="py-3.5 px-2 text-muted-foreground whitespace-nowrap">
                          {new Date(leave.from || leave.startDate).toLocaleDateString()} to {new Date(leave.to || leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground">{new Date(leave.appliedOn || leave.createdAt).toLocaleDateString()}</td>
                        <td
                          className="py-3.5 px-2 text-foreground max-w-xs truncate"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </td>
                        <td className="py-3.5 px-2">{getStatusBadge(leave.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
