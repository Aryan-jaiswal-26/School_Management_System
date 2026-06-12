import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen, Search, ArrowDownUp, BookMarked, Clock, Download, Trash2, SendHorizontal } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/library")({
  head: () => ({ meta: [{ title: "Library · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"dashboard" | "books" | "ebooks" | "add">("dashboard");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(1);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "Mathematics",
    copies: 1,
    shelf: "",
  });

  const [books, setBooks] = useState<any[]>([]);
  const [circulations, setCirculations] = useState<any[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [circulationFilter, setCirculationFilter] = useState<"all" | "overdue" | "reservations">("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Issue Book form
  const today = new Date().toISOString().split("T")[0];
  const [issueForm, setIssueForm] = useState({
    className: "",
    division: "",
    studentId: "",
    studentName: "",
    bookId: "",
    dueDays: 14,
    finePerDay: 2,
  });
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [issuingBook, setIssuingBook] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [schoolSections, setSchoolSections] = useState<any[]>([]);

  const dueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + issueForm.dueDays);
    return d.toISOString().split("T")[0];
  })();

  // E-Book Form states
  const [ebookForm, setEbookForm] = useState({
    title: "",
    category: "Mathematics",
    subject: "",
  });
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [uploadingEbook, setUploadingEbook] = useState(false);

  const fetchData = async () => {
    try {
      const [bRes, cRes, eRes, clRes, secRes, rRes] = await Promise.all([
        apiClient<any>("/library/books"),
        apiClient<any>("/library/circulations"),
        apiClient<any>("/library/ebooks").catch(() => []),
        apiClient<any>("/academics/classes?limit=100").catch(() => []),
        apiClient<any>("/academics/sections?limit=100").catch(() => []),
        apiClient<any>("/library/reservations").catch(() => []),
      ]);
      setBooks(Array.isArray(bRes) ? bRes : bRes?.data || []);
      setCirculations(Array.isArray(cRes) ? cRes : cRes?.data || []);
      setEbooks(Array.isArray(eRes) ? eRes : eRes?.data || []);
      setReservations(Array.isArray(rRes) ? rRes : rRes?.data || []);
      const classes = Array.isArray(clRes) ? clRes : clRes?.data?.classes || clRes?.data?.data || clRes?.data || [];
      const sections = Array.isArray(secRes) ? secRes : secRes?.data?.sections || secRes?.data?.data || secRes?.data || [];
      setSchoolClasses(classes);
      setSchoolSections(sections);
    } catch (err) {
      toast.error("Failed to fetch library data");
    }
  };

  const fetchStudents = async (classId: string, sectionId: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({ classId, limit: "100" });
      if (sectionId) params.append("sectionId", sectionId);
      // Also try with "class" param as fallback since different backends use different names
      const res = await apiClient<any>(`/students?${params.toString()}`).catch(() =>
        apiClient<any>(`/students?class=${classId}${sectionId ? `&section=${sectionId}` : ""}&limit=100`)
      );
      const list = Array.isArray(res) ? res : res?.data?.students || res?.data?.data || res?.data || [];
      setStudents(list);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (issueForm.className) fetchStudents(issueForm.className, issueForm.division);
    else setStudents([]);
  }, [issueForm.className, issueForm.division]);

  const issued = circulations.filter((c) => c.status === "issued").length;
  const overdue = circulations.filter((c) => c.status === "overdue").length;
  const returned = circulations.filter((c) => c.status === "returned").length;
  const totalBooks = books.reduce((a, b) => a + (b.total_copies || 0), 0);
  const filtered = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDeleteBook = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}" from the catalog? This cannot be undone.`)) return;
    try {
      await apiClient(`/library/books/${id}`, { method: "DELETE" });
      toast.success("Book removed", { description: title });
      fetchData();
    } catch {
      toast.error("Failed to delete book");
    }
  };

  const handleDeleteEBook = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}" from E-Books? This cannot be undone.`)) return;
    try {
      await apiClient(`/library/ebooks/${id}`, { method: "DELETE" });
      toast.success("E-Book removed", { description: title });
      fetchData();
    } catch {
      toast.error("Failed to delete E-Book");
    }
  };

  return (
    <div>
      <PageHeader title="Library Management" subtitle="Book circulation, catalog, and inventory" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Today Issued" value={String(issued)} icon={BookMarked} tone="info" />
        <StatCard
          label="Today Returned"
          value={String(returned)}
          icon={ArrowDownUp}
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={String(overdue)}
          delta="Needs follow-up"
          icon={Clock}
          tone="warning"
        />
        <StatCard label="Total Books" value={String(totalBooks)} icon={BookOpen} />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["dashboard", "Circulation"],
            ["books", "Catalog"],
            ["ebooks", "E-Books"],
            ["add", "Add Book"],
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

      {tab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Issue Book Form ── */}
          <div className="lg:col-span-5">
            <Panel title="Issue Book to Student">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!issueForm.bookId) { toast.error("Please select a book"); return; }
                  if (!issueForm.studentId) { toast.error("Please select a student"); return; }
                  setIssuingBook(true);
                  try {
                    await apiClient("/library/circulations/issue", {
                      method: "POST",
                      data: {
                        bookId: issueForm.bookId,
                        studentId: issueForm.studentId,
                        studentName: issueForm.studentName,
                        dueDateDays: issueForm.dueDays,
                        finePerDay: issueForm.finePerDay,
                      },
                    });
                    toast.success("Book issued!", { description: `${books.find(b => b.id === issueForm.bookId)?.title} → ${issueForm.studentName}` });
                    setIssueForm({ className: "", division: "", studentId: "", studentName: "", bookId: "", dueDays: 14, finePerDay: 2 });
                    setStudents([]);
                    fetchData();
                  } catch (err: any) {
                    toast.error(err?.message || "Failed to issue book");
                  } finally {
                    setIssuingBook(false);
                  }
                }}
                className="space-y-4"
              >
                {/* Class + Division row — loaded from school data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
                    <select
                      value={issueForm.className}
                      onChange={(e) => setIssueForm({ ...issueForm, className: e.target.value, division: "", studentId: "", studentName: "" })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      required
                    >
                      <option value="">{schoolClasses.length === 0 ? "No classes found" : "Select class"}</option>
                      {schoolClasses.map((cls: any) => (
                        <option key={cls._id || cls.id} value={cls._id || cls.id}>
                          {cls.name || cls.className || cls.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Division / Section</label>
                    <select
                      value={issueForm.division}
                      onChange={(e) => setIssueForm({ ...issueForm, division: e.target.value, studentId: "", studentName: "" })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      disabled={!issueForm.className}
                    >
                      <option value="">All sections</option>
                      {schoolSections
                        .filter((sec: any) => {
                          const secClassId = sec.classId?._id || sec.classId || sec.class?._id || sec.class;
                          return !issueForm.className || secClassId?.toString() === issueForm.className;
                        })
                        .map((sec: any) => (
                          <option key={sec._id || sec.id} value={sec._id || sec.id}>
                            {sec.name || sec.sectionName || sec.division}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Student */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</label>
                  <select
                    value={issueForm.studentId}
                    onChange={(e) => {
                      const s = students.find((st: any) => st._id === e.target.value || st.id === e.target.value);
                      const nameStr = s?.user
                        ? `${s.user.firstName} ${s.user.lastName}`.trim()
                        : (s?.name || s?.fullName || s?.studentName || "");
                      setIssueForm({ ...issueForm, studentId: e.target.value, studentName: nameStr });
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    required
                    disabled={!issueForm.className || loadingStudents}
                  >
                    <option value="">{loadingStudents ? "Loading..." : issueForm.className ? "Select student" : "Select class first"}</option>
                    {students.map((s: any) => {
                      const nameStr = s.user
                        ? `${s.user.firstName} ${s.user.lastName}`.trim()
                        : (s.name || s.fullName || s.studentName || "Unknown Student");
                      const codeStr = s.admissionNumber || s.studentCode || s.rollNumber || "No Code";
                      return (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {nameStr} ({codeStr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Book */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Book</label>
                  <select
                    value={issueForm.bookId}
                    onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select book</option>
                    {books.filter(b => (b.available_copies || 0) > 0).map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.available_copies} available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Issue Date + Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue Date</label>
                    <input
                      type="date"
                      value={today}
                      readOnly
                      className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      readOnly
                      className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Days + Fine row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Return in (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={issueForm.dueDays}
                      onChange={(e) => setIssueForm({ ...issueForm, dueDays: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Late Fine / Day (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={issueForm.finePerDay}
                      onChange={(e) => setIssueForm({ ...issueForm, finePerDay: Number(e.target.value) })}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={issuingBook}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {issuingBook ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Issuing...</>
                  ) : (
                    <><SendHorizontal className="h-4 w-4" />Issue Book</>
                  )}
                </button>
              </form>
            </Panel>
          </div>

          {/* ── Active Circulations List ── */}
          <div className="lg:col-span-7">
            <Panel title="Active Circulations">
              {/* Filter Toggles */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setCirculationFilter("all")}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    circulationFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Active ({circulations.filter((c) => c.status !== "returned").length})
                </button>
                <button
                  type="button"
                  onClick={() => setCirculationFilter("overdue")}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    circulationFilter === "overdue"
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Overdue ({
                    circulations.filter((c) => {
                      const isOverdue = c.status === "overdue" || (c.status !== "returned" && new Date(c.due_date) < new Date());
                      return isOverdue;
                    }).length
                  })
                </button>
                <button
                  type="button"
                  onClick={() => setCirculationFilter("reservations")}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    circulationFilter === "reservations"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Reservations ({reservations.filter((r) => r.status === "pending").length})
                </button>
              </div>

              {/* Circulations Lists */}
              {circulationFilter !== "reservations" ? (
                <div className="space-y-3">
                  {circulations
                    .filter((c) => {
                      const isOverdue = c.status === "overdue" || (c.status !== "returned" && new Date(c.due_date) < new Date());
                      if (circulationFilter === "overdue") {
                        return isOverdue;
                      }
                      return c.status !== "returned";
                    })
                    .map((c) => {
                      const isOverdue = c.status === "overdue" || (c.status !== "returned" && new Date(c.due_date) < new Date());
                      
                      // Fine calculation
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
                        >
                          <div>
                            <div className="font-medium text-sm">{c.book_title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium text-foreground">{c.student_name}</span>
                              {c.student_code && ` (${c.student_code})`}
                              {c.class_name && ` · Class ${c.class_name}${c.section_name ? `-${c.section_name}` : ''}`}
                              {' · '}
                              Issued: {new Date(c.issued_date).toLocaleDateString()} · Due: {new Date(c.due_date).toLocaleDateString()}
                            </div>
                            {isOverdue && (
                              <div className="text-xs text-destructive font-semibold mt-2.5 flex items-center gap-1.5 bg-destructive/5 px-2.5 py-1.5 rounded-lg border border-destructive/10 w-fit">
                                Accumulated Fine: ₹{currentFine} (₹{c.fine_per_day}/day late)
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isOverdue ? "bg-destructive/10 text-destructive"
                              : c.status === "returned" ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"
                              : "bg-accent/10 text-accent"
                            }`}>{isOverdue ? "overdue" : c.status}</span>
                            {c.status !== "returned" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await apiClient(`/library/circulations/${c.id}/return`, { method: "POST" });
                                    toast.success("Book returned", { description: c.book_title });
                                    fetchData();
                                  } catch {
                                    toast.error("Failed to return book");
                                  }
                                }}
                                className="rounded-lg bg-[oklch(0.65_0.15_155)]/15 px-3 py-1.5 text-xs font-medium text-[oklch(0.45_0.15_155)] hover:bg-[oklch(0.65_0.15_155)]/25 transition-all active:scale-95"
                              >
                                Return
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations
                    .filter((r) => r.status === "pending")
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4 animate-fade-in"
                      >
                        <div>
                          <div className="font-semibold text-sm">{r.book_title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{r.student_name}</span>
                            {r.student_code && ` (${r.student_code})`}
                            {r.class_name && ` · Class ${r.class_name}${r.section_name ? `-${r.section_name}` : ''}`}
                            {' · '}
                            Reserved: {new Date(r.reservation_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIssueForm({
                                className: r.class_id,
                                division: r.section_id,
                                studentId: r.student_id,
                                studentName: r.student_name,
                                bookId: r.book_id,
                                dueDays: 14,
                                finePerDay: 2
                              });
                              setStudents([
                                {
                                  _id: r.student_id,
                                  admissionNumber: r.student_code,
                                  user: {
                                    firstName: r.student_name.split(' ')[0],
                                    lastName: r.student_name.split(' ')[1] || ''
                                  }
                                }
                              ]);
                              toast.success("Hold loaded into Issue Book Form!");
                            }}
                            className="rounded-lg bg-[oklch(0.65_0.15_155)]/10 px-3 py-1.5 text-xs font-semibold text-[oklch(0.45_0.15_155)] hover:bg-[oklch(0.65_0.15_155)]/20 transition-all active:scale-95"
                          >
                            Fulfill Hold
                          </button>
                          <button
                            type="button"
                            disabled={cancellingId === r.id}
                            onClick={async () => {
                              if (!window.confirm("Cancel this reservation?")) return;
                              setCancellingId(r.id);
                              try {
                                await apiClient(`/library/reservations/${r.id}/cancel`, { method: "POST" });
                                toast.success("Reservation cancelled");
                                fetchData();
                              } catch (err: any) {
                                toast.error(err.message || "Failed to cancel reservation");
                              } finally {
                                setCancellingId(null);
                              }
                            }}
                            className="rounded-lg border border-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {cancellingId === r.id ? "Cancelling..." : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Empty States */}
              {circulationFilter !== "reservations" ? (
                circulations.filter((c) => {
                  const isOverdue = c.status === "overdue" || (c.status !== "returned" && new Date(c.due_date) < new Date());
                  if (circulationFilter === "overdue") {
                    return isOverdue;
                  }
                  return c.status !== "returned";
                }).length === 0 && (
                  <EmptyState
                    icon={BookOpen}
                    title={circulationFilter === "overdue" ? "No overdue books" : "No circulations"}
                    description={circulationFilter === "overdue" ? "All issued books are within their due dates." : "Issue a book using the form to get started."}
                  />
                )
              ) : (
                reservations.filter((r) => r.status === "pending").length === 0 && (
                  <EmptyState
                    icon={BookOpen}
                    title="No pending reservations"
                    description="Students will appear here once they request a book hold."
                  />
                )
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === "books" && (
        <Panel title="Book Catalog">
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or author…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Author</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Shelf</th>
                  <th className="pb-3 pr-4">Available</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">{b.title}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{b.author}</td>
                    <td className="py-3 pr-4">{b.category}</td>
                    <td className="py-3 pr-4">{b.shelf}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            (b.available_copies || 0) > 0 ? "text-[oklch(0.45_0.15_155)]" : "text-destructive font-semibold"
                          }
                        >
                          {b.available_copies || 0}/{b.total_copies || 0}
                        </span>
                        {b.available_copies === 0 && (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wider">Out of Stock</span>
                        )}
                        {b.available_copies > 0 && b.available_copies <= 2 && (
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Low Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteBook(b.id, b.title)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <div key={b.id} className="rounded-lg border border-border p-3">
                <div className="font-medium text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground">
                  {b.author} · {b.category} · Shelf {b.shelf}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs flex flex-wrap items-center gap-2">
                    <span>Available: {b.available_copies || 0}/{b.total_copies || 0}</span>
                    {b.available_copies === 0 && (
                      <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold text-destructive uppercase tracking-wider">Out of Stock</span>
                    )}
                    {b.available_copies > 0 && b.available_copies <= 2 && (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wider">Low Stock</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteBook(b.id, b.title)}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "ebooks" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Panel title="Upload E-Book">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!ebookFile) {
                    toast.error("Please select an E-Book file to upload");
                    return;
                  }
                  setUploadingEbook(true);
                  try {
                    const formData = new FormData();
                    formData.append("title", ebookForm.title);
                    formData.append("category", ebookForm.category);
                    formData.append("subject", ebookForm.subject);
                    formData.append("file", ebookFile);

                    const res = await fetch("/api/v1/library/ebooks", {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    });

                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || "Upload failed");
                    }

                    toast.success("E-Book uploaded successfully!");
                    setEbookForm({
                      title: "",
                      category: "Mathematics",
                      subject: "",
                    });
                    setEbookFile(null);
                    const fileInput = document.getElementById("ebook-file-input") as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
                    fetchData();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to upload E-Book");
                  } finally {
                    setUploadingEbook(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-Book Title</label>
                  <input
                    required
                    value={ebookForm.title}
                    onChange={(e) => setEbookForm({ ...ebookForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Real Analysis"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
                  <select
                    value={ebookForm.category}
                    onChange={(e) => setEbookForm({ ...ebookForm, category: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Literature</option>
                    <option>Science</option>
                    <option>History</option>
                    <option>Computer Science</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Subject (Optional)</label>
                  <input
                    value={ebookForm.subject}
                    onChange={(e) => setEbookForm({ ...ebookForm, subject: e.target.value })}
                    placeholder="e.g. Calculus, Mechanics"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">File (PDF, EPUB, etc.)</label>
                  <input
                    id="ebook-file-input"
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setEbookFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingEbook}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {uploadingEbook ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Uploading...
                    </>
                  ) : (
                    "Upload E-Book"
                  )}
                </button>
              </form>
            </Panel>
          </div>
          <div className="lg:col-span-8">
            <Panel title="E-Book Catalog">
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4">Subject</th>
                      <th className="pb-3 pr-4">Format</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ebooks.map((e) => (
                      <tr key={e._id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 font-medium">{e.title}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{e.category}</td>
                        <td className="py-3 pr-4">{e.subject || "—"}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                            {e.fileType}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/v1/library/ebooks/${e._id}/download`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                            <button
                              onClick={() => handleDeleteEBook(e._id, e.title)}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {ebooks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No E-Books uploaded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {ebooks.map((e) => (
                  <div key={e._id} className="rounded-lg border border-border p-3">
                    <div>
                      <div className="font-medium text-sm">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.category} · {e.subject || "No Subject"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={`/api/v1/library/ebooks/${e._id}/download`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteEBook(e._id, e.title)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {ebooks.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No E-Books uploaded yet.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "add" && (
        <Panel title={`Add Book — Step ${step} of 3`}>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${s <= step ? "bg-accent" : "bg-muted"}`}
              />
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (step < 3) {
                setStep((s) => s + 1);
                return;
              }
              try {
                await apiClient("/library/books", {
                  method: "POST",
                  data: {
                    title: bookForm.title,
                    author: bookForm.author,
                    isbn: bookForm.isbn,
                    category: bookForm.category,
                    totalCopies: bookForm.copies,
                    available: bookForm.copies,
                    shelf: bookForm.shelf,
                  }
                });
                toast.success("Book added to catalog");
                setBookForm({
                  title: "",
                  author: "",
                  isbn: "",
                  category: "Mathematics",
                  copies: 1,
                  shelf: "",
                });
                setStep(1);
                setTab("books");
                fetchData();
              } catch (err) {
                toast.error("Failed to add book");
              }
            }}
            className="space-y-4"
          >
            {step === 1 && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Book Title</label>
                  <input
                    name="title"
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Author</label>
                  <input
                    name="author"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">ISBN</label>
                  <input
                    name="isbn"
                    required
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category</label>
                  <select
                    name="category"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Literature</option>
                    <option>Science</option>
                    <option>History</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Number of Copies</label>
                  <input
                    name="copies"
                    type="number"
                    value={bookForm.copies}
                    onChange={(e) => setBookForm({ ...bookForm, copies: Number(e.target.value) })}
                    min={1}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Shelf Location</label>
                  <input
                    name="shelf"
                    required
                    placeholder="e.g. M-01"
                    value={bookForm.shelf}
                    onChange={(e) => setBookForm({ ...bookForm, shelf: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  Review your entries and click "Add Book" to save.
                </div>
              </>
            )}
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                {step < 3 ? "Next" : "Add Book"}
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
