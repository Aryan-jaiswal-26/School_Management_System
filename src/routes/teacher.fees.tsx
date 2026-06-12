import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Search,
  DollarSign,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/teacher/fees")({
  head: () => ({ meta: [{ title: "Student Fee Status · Campus OS" }] }),
  component: Page,
});

function Page() {
  const teacherClass = "10-A";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allFees, setAllFees] = useState<any[]>([]);

  useEffect(() => {
    apiClient<any>("/fees")
      .then((res) => setAllFees(res?.data || []))
      .catch(() => {});
  }, []);

  const records = allFees.filter((r) => {
    const studentName = `${r.student?.user?.firstName || ""} ${r.student?.user?.lastName || r.studentName || ""}`.toLowerCase();
    const matchesSearch = studentName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = records.reduce(
    (acc: any, curr: any) => {
      acc.total += curr.amount || curr.totalAmount || 0;
      acc.paid += curr.paidAmount || curr.paid || 0;
      acc.due += curr.dueAmount || curr.due || 0;
      return acc;
    },
    { total: 0, paid: 0, due: 0 },
  );

  const handleNudge = (studentName: string) => {
    toast.success("Reminder notice sent!", {
      description: `Sent fee reminder SMS to guardian of ${studentName}.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.65_0.15_155)]/10 px-2.5 py-0.5 text-xs font-semibold text-[oklch(0.45_0.15_155)]">
            <CheckCircle className="h-3 w-3" /> Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.75_0.15_75)]/10 px-2.5 py-0.5 text-xs font-semibold text-[oklch(0.50_0.15_75)]">
            <Clock className="h-3 w-3" /> Partial
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" /> Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fee Status"
        subtitle={`Overview of fee collections and dues for Class ${teacherClass}.`}
      />

      {/* Stats summaries */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Expected
            </span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            ₹{totals.total.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">For class {teacherClass}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Collected
            </span>
            <span className="rounded-lg bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-[oklch(0.45_0.15_155)]">
            ₹{totals.paid.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0}% collection rate
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Outstanding Balance
            </span>
            <span className="rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-destructive">
            ₹{totals.due.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending dues to be collected</p>
        </div>
      </div>

      {/* Table controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students in Class..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
        >
          <option value="all">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Main Table */}
      <Panel title="Fee Collection Roll">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">No records matches filters</div>
            <div className="text-xs text-muted-foreground mt-1">
              Try resetting filters or search query.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-2 font-medium">Student Name</th>
                  <th className="py-3 px-2 font-medium">Category</th>
                  <th className="py-3 px-2 font-medium">Total Amount</th>
                  <th className="py-3 px-2 font-medium">Paid</th>
                  <th className="py-3 px-2 font-medium">Due</th>
                  <th className="py-3 px-2 font-medium">Due Date</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                  <th className="py-3 px-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((rec: any) => {
                  const studentName = `${rec.student?.user?.firstName || ""} ${rec.student?.user?.lastName || rec.studentName || ""}`.trim();
                  const amount = rec.amount || rec.totalAmount || 0;
                  const paid = rec.paidAmount || rec.paid || 0;
                  const due = rec.dueAmount || rec.due || (amount - paid);
                  const dueDate = rec.dueDate || rec.due_date || "—";
                  const category = rec.feeType || rec.category || "Fee";
                  const status = rec.status || (due > 0 ? "pending" : "paid");
                  return (
                    <tr key={rec._id || rec.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3.5 px-2 font-semibold text-foreground">{studentName}</td>
                      <td className="py-3.5 px-2 text-muted-foreground">{category}</td>
                      <td className="py-3.5 px-2 text-foreground font-medium">
                        ₹{amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 text-[oklch(0.45_0.15_155)] font-medium">
                        ₹{paid.toLocaleString()}
                      </td>
                      <td
                        className={`py-3.5 px-2 font-medium ${due > 0 ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        ₹{due.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-2">{getStatusBadge(status.toLowerCase())}</td>
                      <td className="py-3.5 px-2 text-right">
                        {due > 0 ? (
                          <button
                            onClick={() => handleNudge(studentName)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
                          >
                            <Send className="h-3 w-3" />
                            Remind
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
