import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen, BookMarked, Clock, BookmarkPlus } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/parent/library")({
  head: () => ({ meta: [{ title: "Child's Library Activity · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"issued" | "reservations" | "fines">("issued");
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [activeChildName, setActiveChildName] = useState<string>("Student");
  const [circulations, setCirculations] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);

  useEffect(() => {
    const handleSync = () => {
      setActiveChildId(localStorage.getItem("parent_active_child") || "");
      setActiveChildName(localStorage.getItem("parent_active_child_name") || "Student");
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const fetchData = async () => {
    if (!activeChildId) return;
    try {
      const [cRes, rRes, fRes] = await Promise.all([
        apiClient<any>(`/library/circulations/student/${activeChildId}`), 
        apiClient<any>(`/library/reservations/student/${activeChildId}`),
        apiClient<any>(`/library/fines/student/${activeChildId}`),
      ]);
      setCirculations(Array.isArray(cRes) ? cRes : cRes?.data || []);
      setReservations(Array.isArray(rRes) ? rRes : rRes?.data || []);
      setFines(Array.isArray(fRes) ? fRes : fRes?.data || []);
    } catch (err) {
      toast.error("Failed to load library data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeChildId]);

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child from the top bar to view library details.</p>
      </div>
    );
  }

  const activeIssued = circulations.filter((c) => c.status === "issued" || c.status === "overdue");
  const overdueCount = circulations.filter((c) => c.status === "overdue").length;
  const unpaidFines = fines.filter((f) => f.status === "unpaid").reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Library Activity" subtitle="Track your child's library books, due dates, and fines" />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard label="Books Currently Issued" value={String(activeIssued.length)} icon={BookMarked} tone="info" />
        <StatCard label="Overdue Books" value={String(overdueCount)} icon={Clock} tone={overdueCount > 0 ? "warning" : "success"} />
        <StatCard label="Pending Fines" value={`$${unpaidFines.toFixed(2)}`} icon={BookOpen} tone={unpaidFines > 0 ? "destructive" : "success"} />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["issued", "Issued Books"],
            ["reservations", "Reservations"],
            ["fines", "Fines"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "issued" && (
        <Panel title="Issued Books">
          <div className="space-y-4">
            {activeIssued.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <h3 className="font-semibold">{c.book_title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Student: {c.student_name}</p>
                  <p className="text-sm text-muted-foreground">Issued: {new Date(c.issued_date).toLocaleDateString()}</p>
                  <p className={`text-sm font-medium mt-1 ${new Date(c.due_date) < new Date() ? "text-destructive" : ""}`}>
                    Due: {new Date(c.due_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
            ))}
            {activeIssued.length === 0 && (
              <EmptyState icon={BookMarked} title="No issued books" description="Your child has no books currently issued." />
            )}
          </div>
        </Panel>
      )}

      {tab === "reservations" && (
        <Panel title="Reservations">
          <div className="space-y-4">
            {reservations.map((r) => (
              <div key={r._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <h3 className="font-semibold">Book ID: {r.bookId}</h3>
                  <p className="text-sm text-muted-foreground">Reserved on: {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  {r.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            ))}
            {reservations.length === 0 && (
              <EmptyState icon={BookmarkPlus} title="No reservations" description="No active reservations found." />
            )}
          </div>
        </Panel>
      )}

      {tab === "fines" && (
        <Panel title="Library Fines">
          <div className="space-y-4">
            {fines.map((f) => (
              <div key={f._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div>
                  <h3 className="font-semibold capitalize">{f.reason} Fine</h3>
                  <p className="text-sm text-muted-foreground">{f.remarks}</p>
                  <p className="text-xs text-muted-foreground mt-1">Date: {new Date(f.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg mb-1">${f.amount?.toFixed(2)}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${f.status === "unpaid" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {f.status?.toUpperCase()}
                    </span>
                  </div>
                  {f.status === "unpaid" && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient(`/library/fines/${f._id}/pay`, { method: "POST" });
                          toast.success("Fine paid successfully!");
                          fetchData();
                        } catch (err) {
                          toast.error("Failed to process payment");
                        }
                      }}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
            {fines.length === 0 && (
              <EmptyState icon={BookOpen} title="No fines" description="No library fines found." />
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
