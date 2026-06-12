import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, Search, BookMarked, Clock, Download } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/student/library")({
  head: () => ({ meta: [{ title: "My Library · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"catalog" | "issued" | "ebooks">("catalog");
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [circulations, setCirculations] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        apiClient<any>("/library/books"),
        apiClient<any>("/library/ebooks").catch(() => []),
      ]);
      setBooks(Array.isArray(bRes) ? bRes : bRes?.data || []);
      setEbooks(Array.isArray(eRes) ? eRes : eRes?.data || []);

      if (user?.studentId) {
        const [cRes, rRes] = await Promise.all([
          apiClient<any>(`/library/circulations/student/${user.studentId}`).catch(() => []),
          apiClient<any>(`/library/reservations/student/${user.studentId}`).catch(() => []),
        ]);
        setCirculations(Array.isArray(cRes) ? cRes : cRes?.data || []);
        setReservations(Array.isArray(rRes) ? rRes : rRes?.data || []);
      }
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.studentId]);

  const activeIssued = circulations.filter(
    (c) => c.status === "issued" || c.status === "overdue"
  );
  const overdueCount = circulations.filter((c) => c.status === "overdue").length;

  const filteredBooks = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="My Library"
        subtitle="Search books, view your issued items, and access e-books"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <StatCard
          label="Currently Issued"
          value={String(activeIssued.length)}
          icon={BookMarked}
          tone="info"
        />
        <StatCard
          label="Overdue Books"
          value={String(overdueCount)}
          icon={Clock}
          tone={overdueCount > 0 ? "warning" : "success"}
        />
      </div>

      <div className="flex overflow-x-auto gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["catalog", "Search Catalog"],
            ["issued", "My Books"],
            ["ebooks", "E-Books"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === k
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Catalog ── */}
      {tab === "catalog" && (
        <Panel title={`Book Catalog (${filteredBooks.length} book${filteredBooks.length !== 1 ? "s" : ""})`}>
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or category…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-border p-4 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-base mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">by {b.author}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded-md">{b.category}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-md">
                      Shelf: {b.shelf}
                    </span>
                  </div>
                </div>
                 <div className="flex items-center justify-between mt-auto">
                  <span
                    className={`text-sm font-medium ${
                      (b.available_copies || 0) > 0
                        ? "text-[oklch(0.45_0.15_155)]"
                        : "text-destructive font-semibold"
                    }`}
                  >
                    {(b.available_copies || 0) > 0
                      ? `${b.available_copies}/${b.total_copies} Available`
                      : "Out of Stock"}
                  </span>
                  <button
                    disabled={reservingId === b.id}
                    onClick={async () => {
                      setReservingId(b.id);
                      try {
                        await apiClient("/library/reservations/reserve", {
                          method: "POST",
                          data: { bookId: b.id },
                        });
                        toast.success("Book reserved successfully!");
                        fetchData();
                      } catch (err: any) {
                        toast.error(err.message || "Failed to reserve book");
                      } finally {
                        setReservingId(null);
                      }
                    }}
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {reservingId === b.id ? "Reserving..." : "Reserve"}
                  </button>
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Search}
                  title={search ? "No books found" : "No books in catalog"}
                  description={
                    search
                      ? "Try adjusting your search query."
                      : "The library catalog is empty. Books added by the admin will appear here."
                  }
                />
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ── My Issued Books ── */}
      {tab === "issued" && (
        <div className="space-y-6">
          <Panel title="My Issued Books">
          <div className="space-y-4">
            {activeIssued.map((c) => {
              const isOverdue = c.status === "overdue" || (c.status !== "returned" && new Date(c.due_date) < new Date());
              
              // Calculate live late fine
              let currentFine = 0;
              if (isOverdue) {
                const dueDate = new Date(c.due_date);
                const now = new Date();
                const diffTime = now.getTime() - dueDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                  currentFine = diffDays * (c.fine_per_day || 0);
                }
              }

              return (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4"
                >
                  <div>
                    <h3 className="font-semibold">{c.book_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Issued: {new Date(c.issued_date).toLocaleDateString()}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        isOverdue ? "text-destructive" : ""
                      }`}
                    >
                      Due: {new Date(c.due_date).toLocaleDateString()}
                    </p>
                    {isOverdue && (
                      <div className="text-xs text-destructive font-semibold mt-2.5 flex items-center gap-1.5 bg-destructive/5 px-2.5 py-1.5 rounded-lg border border-destructive/10 w-fit">
                        Accumulated Fine: ₹{currentFine} (₹{c.fine_per_day}/day late)
                      </div>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                      isOverdue
                        ? "bg-destructive/10 text-destructive font-semibold"
                        : "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"
                    }`}
                  >
                    {isOverdue ? "OVERDUE" : c.status}
                  </span>
                </div>
              );
            })}
            {activeIssued.length === 0 && (
              <EmptyState
                icon={BookMarked}
                title="No issued books"
                description="You currently have no books issued."
              />
            )}
          </div>
        </Panel>

        <Panel title="My Reservations">
          <div className="space-y-4">
            {reservations.map((r) => (
              <div
                key={r._id || r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div>
                  <h3 className="font-semibold">{r.bookId?.title || "Book Title"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Reserved on: {new Date(r.reservationDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.status === "pending" && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Cancel this reservation?")) return;
                        try {
                          await apiClient(`/library/reservations/${r._id || r.id}/cancel`, { method: "POST" });
                          toast.success("Reservation cancelled successfully");
                          fetchData();
                        } catch (err: any) {
                          toast.error(err.message || "Failed to cancel reservation");
                        }
                      }}
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                      r.status === "pending"
                        ? "bg-warning/10 text-warning"
                        : r.status === "fulfilled"
                        ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
            {reservations.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="No reservations"
                description="You currently have no active reservations."
              />
            )}
          </div>
        </Panel>
      </div>
      )}

      {/* ── E-Books ── */}
      {tab === "ebooks" && (
        <Panel title={`E-Books & Digital Resources (${ebooks.length})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ebooks.map((e) => (
              <div key={e._id} className="rounded-lg border border-border p-4 flex flex-col gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{e.title}</h3>
                  <p className="text-sm text-muted-foreground">{e.category}</p>
                  {e.subject && (
                    <p className="text-xs text-muted-foreground">{e.subject}</p>
                  )}
                  <span className="mt-2 inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    {e.fileType || "PDF"}
                  </span>
                </div>
                <a
                  href={`/api/v1/library/ebooks/${e._id}/download`}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  Download {e.fileType || "PDF"}
                </a>
              </div>
            ))}
            {ebooks.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Download}
                  title="No E-Books available"
                  description="Digital resources uploaded by the admin will appear here."
                />
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
