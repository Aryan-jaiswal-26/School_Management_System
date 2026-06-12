import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  Download,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Video,
  Star,
  X,
  Loader2,
  Trophy,
  Shield,
  AlertCircle,
  BookOpen,
  Award,
  CalendarDays,
} from "lucide-react";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/module-shell";
import {
  fetchStudentAcademics,
  fetchStudentHomework,
  fetchStudentReportCards,
  fetchPtmMeetings,
  createPtmMeeting,
  fetchChildAttendance,
} from "@/lib/parent-api";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/parent/academics")({
  head: () => ({ meta: [{ title: "Academic Oversight · Campus OS" }] }),
  component: ParentAcademics,
});

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function AttendanceCalendar({ records }: { records: any[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const recordMap: Record<string, string> = {};
  records.forEach((r: any) => {
    const d = r.date ? new Date(r.date).toDateString() : null;
    if (d) recordMap[d] = r.status || r.attendance || "present";
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const presentDays = Object.values(recordMap).filter((s) => s.toLowerCase().includes("present")).length;
  const absentDays = Object.values(recordMap).filter((s) => s.toLowerCase().includes("absent")).length;
  const lateDays = Object.values(recordMap).filter((s) => s.toLowerCase().includes("late")).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          ‹
        </button>
        <span className="font-bold text-foreground text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-[10px] font-bold uppercase text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = new Date(year, month, day).toDateString();
          const status = recordMap[dateStr]?.toLowerCase() || "";
          const isToday = new Date(year, month, day).toDateString() === today.toDateString();
          let bgClass = "bg-muted/40 text-muted-foreground";
          if (status.includes("present")) bgClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
          else if (status.includes("absent")) bgClass = "bg-red-500/20 text-red-700 dark:text-red-400";
          else if (status.includes("late")) bgClass = "bg-amber-500/20 text-amber-700 dark:text-amber-400";
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${bgClass} ${
                isToday ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 text-[10px] font-semibold">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {presentDays} Present
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          {absentDays} Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          {lateDays} Late
        </span>
      </div>
    </div>
  );
}

// ─── Mock data defined outside component to avoid re-creation ─────────────────
const MOCK_EXAMS = [
  { id: 1, subject: "Mathematics", examType: "Unit Test 3", date: "2026-06-20", time: "09:00 AM", duration: "2 hrs", venue: "Hall A", syllabus: "Ch. 8-12", status: "upcoming" },
  { id: 2, subject: "Science", examType: "Mid-Term", date: "2026-06-22", time: "10:00 AM", duration: "3 hrs", venue: "Hall B", syllabus: "Ch. 5-9", status: "upcoming" },
  { id: 3, subject: "English", examType: "Unit Test 3", date: "2026-06-24", time: "09:00 AM", duration: "2 hrs", venue: "Hall A", syllabus: "Poetry & Prose", status: "upcoming" },
  { id: 4, subject: "Social Studies", examType: "Quarterly", date: "2026-05-15", time: "09:30 AM", duration: "2.5 hrs", venue: "Hall C", syllabus: "Ch. 1-6", status: "completed", score: "82/100" },
];

const MOCK_DISCIPLINE = [
  { id: 1, date: "2026-05-28", type: "Positive", category: "Academic Excellence", description: "Scored 100% in Math quiz. Praised by teacher.", teacher: "Ms. Priya", action: "Star of the Week" },
  { id: 2, date: "2026-05-10", type: "Warning", category: "Late Submission", description: "Science homework submitted 2 days late.", teacher: "Mr. Rajan", action: "Verbal Warning" },
  { id: 3, date: "2026-04-22", type: "Positive", category: "Sports Achievement", description: "Won 1st place in inter-class relay race.", teacher: "Coach Suresh", action: "Sports Certificate" },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, title: "Mathematics Excellence Award", type: "Academic", date: "2026-04-15", description: "Top scorer in Term 1 Mathematics exam.", badge: "🏆", issuer: "Principal" },
  { id: 2, title: "Science Olympiad Participant", type: "Competition", date: "2026-03-20", description: "Represented school in District Science Olympiad.", badge: "🔬", issuer: "School Board" },
  { id: 3, title: "Perfect Attendance Badge", type: "Attendance", date: "2026-02-28", description: "100% attendance for the month of February.", badge: "⭐", issuer: "Class Teacher" },
  { id: 4, title: "Art & Craft 1st Prize", type: "Extra-Curricular", date: "2026-01-26", description: "First prize in Annual Art Competition.", badge: "🎨", issuer: "Arts Department" },
];

function ParentAcademics() {
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "exams" | "behavior" | "achievements">("overview");
  const [showPtmModal, setShowPtmModal] = useState(false);
  const [viewingReportCard, setViewingReportCard] = useState<any | null>(null);

  const [academics, setAcademics] = useState<any>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  const [disciplineRecords, setDisciplineRecords] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem("parent_active_child") || "";
      setActiveChildId(stored);
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const loadData = useCallback(async () => {
    if (!activeChildId) return;
    setIsLoading(true);
    setError("");
    try {
      const [acad, hw, rcs, ptm, att] = await Promise.allSettled([
        fetchStudentAcademics(activeChildId),
        fetchStudentHomework(activeChildId),
        fetchStudentReportCards(activeChildId),
        fetchPtmMeetings(activeChildId),
        fetchChildAttendance(activeChildId),
      ]);
      setAcademics(acad.status === "fulfilled" ? acad.value : null);
      setHomework(hw.status === "fulfilled" && Array.isArray(hw.value) ? hw.value : []);
      setReportCards(rcs.status === "fulfilled" && Array.isArray(rcs.value) ? rcs.value : []);
      setMeetings(ptm.status === "fulfilled" && Array.isArray(ptm.value) ? ptm.value : []);
      const attData = att.status === "fulfilled" ? att.value : [];
      setAttendance(Array.isArray(attData) ? attData : (attData?.records || []));

      // Load exams, discipline and achievements in parallel
      const [examsRes, discRes, achRes] = await Promise.allSettled([
        apiClient<any>(`/exams?studentId=${activeChildId}`),
        apiClient<any>(`/discipline/student/${activeChildId}`),
        apiClient<any>("/sports/achievements"),
      ]);
      setExamSchedule(
        examsRes.status === "fulfilled"
          ? (Array.isArray(examsRes.value) ? examsRes.value : examsRes.value?.data || [])
          : []
      );
      setDisciplineRecords(
        discRes.status === "fulfilled"
          ? (Array.isArray(discRes.value) ? discRes.value : discRes.value?.data || [])
          : []
      );
      const rawAchievements = achRes.status === "fulfilled"
        ? (Array.isArray(achRes.value) ? achRes.value : achRes.value?.data || [])
        : [];
      const sName = acad.status === "fulfilled" ? (acad.value?.studentName || acad.value?.name || "") : "";
      if (sName) {
        setAchievements(rawAchievements.filter((ach: any) => ach.studentName?.trim().toLowerCase() === sName.trim().toLowerCase()));
      } else {
        setAchievements(rawAchievements);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load academic data.");
    } finally {
      setIsLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const studentName = academics?.studentName || academics?.name || "Student";
  const gpa = academics?.cgpa ?? academics?.gpa ?? "—";
  const rank = academics?.rank ?? "—";
  const completedHW = homework.filter((h) => h.grade && h.grade !== "Pending").length;

  const totalAttDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status?.toLowerCase().includes("present")).length;
  const attendancePct = totalAttDays > 0 ? Math.round((presentDays / totalAttDays) * 100) : 0;

  const handleBookMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const newMeeting = await createPtmMeeting(activeChildId, {
        teacher: fd.get("teacher") as string,
        subject: fd.get("subject") as string,
        dateTime: fd.get("dateTime") as string,
        type: fd.get("type") as string,
      });
      setMeetings((prev) => [...prev, newMeeting]);
      toast.success("Parent-Teacher Conference Booked!");
    } catch {
      setMeetings((prev) => [
        ...prev,
        {
          id: "PTM-" + Math.floor(100 + Math.random() * 900),
          teacherName: fd.get("teacher"),
          subject: fd.get("subject"),
          dateTime: fd.get("dateTime"),
          type: fd.get("type"),
          status: "scheduled",
        },
      ]);
      toast.success("PTM slot booked!");
    }
    setShowPtmModal(false);
  };

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <GraduationCap className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child from the top bar to view academics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading academic records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-destructive font-semibold mb-2">Failed to load data</div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { key: "overview",      label: "Overview",             icon: GraduationCap },
    { key: "attendance",    label: "Attendance",           icon: CalendarDays  },
    { key: "exams",         label: "Exam Schedule",        icon: BookOpen      },
    { key: "behavior",      label: "Behavior & Discipline", icon: Shield       },
    { key: "achievements",  label: "Certificates & Badges", icon: Trophy      },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Academic Performance & Oversight"
        subtitle={`Complete academic monitoring for ${studentName}`}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard label="Yearly GPA"       value={String(gpa)}   icon={GraduationCap} tone="success" />
        <StatCard label="Class Rank"        value={String(rank)}  icon={Star}          tone="info"    />
        <StatCard
          label="Attendance"
          value={`${attendancePct}%`}
          icon={Clock}
          tone={attendancePct >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="HW Completion"
          value={homework.length ? `${completedHW}/${homework.length}` : "—"}
          icon={CheckCircle}
          tone="success"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all border-b-2 ${
              activeTab === key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Homework Diary & Teacher Assessments">
              {homework.length === 0 ? (
                <EmptyState icon={CheckCircle} title="No Homework Records" description="Homework assigned by teachers will appear here." />
              ) : (
                <div className="space-y-4">
                  {homework.map((hw: any, i: number) => (
                    <div key={hw._id || i} className="rounded-xl border border-border p-4 bg-card/75 flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider bg-accent/15 text-accent px-2.5 py-0.5 rounded-full">
                            {hw.subject || hw.subjectName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Assigned: {hw.assignedDate ? new Date(hw.assignedDate).toLocaleDateString() : hw.assigned} · by {hw.teacherName || hw.teacher}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{hw.description || hw.desc || hw.title}</p>
                        {hw.feedback && hw.grade !== "Pending" && (
                          <div className="mt-2 bg-muted/40 p-2.5 rounded-lg border border-border flex items-start gap-2 text-xs">
                            <span className="font-bold text-[oklch(0.45_0.15_155)] uppercase">Teacher Feedback:</span>
                            <span className="text-muted-foreground">"{hw.feedback}"</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground uppercase">Grade / Status</div>
                        <span className={`text-base font-bold ${!hw.grade || hw.grade === "Pending" ? "text-amber-500" : "text-[oklch(0.45_0.15_155)]"}`}>
                          {hw.grade || "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Report Card Vault">
              {reportCards.length === 0 ? (
                <EmptyState icon={FileText} title="No Report Cards" description="Published report cards will appear here." />
              ) : (
                <div className="space-y-3">
                  {reportCards.map((rc: any, i: number) => (
                    <div key={rc._id || i} className="rounded-xl border border-border p-4 bg-card/70 flex items-center justify-between shadow-sm hover:shadow">
                      <div className="flex items-center gap-3">
                        <FileText className="h-9 w-9 text-accent/80" />
                        <div>
                          <div className="text-sm font-bold text-foreground">{rc.term || rc.examName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Issued: {rc.date ? new Date(rc.date).toLocaleDateString() : rc.issuedDate} · Overall CGPA:{" "}
                            <span className="text-foreground font-semibold">{rc.cgpa ?? rc.gpa ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingReportCard(rc)}
                        className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold bg-accent/5 hover:bg-accent/10 px-3.5 py-2 rounded-lg border border-accent/15 transition-all active:scale-95"
                      >
                        <Download className="h-3.5 w-3.5" />
                        View Card
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div>
            <Panel
              title="PTM Meeting Conferences"
              action={
                <button onClick={() => setShowPtmModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold">
                  <Calendar className="h-4 w-4" /> Book PTM Slot
                </button>
              }
            >
              <div className="space-y-4">
                {meetings.map((m: any, i: number) => (
                  <div key={m._id || m.id || i} className="rounded-xl border border-border p-3.5 bg-card/85 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {m._id?.slice(-6).toUpperCase() || m.id}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${m.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {m.status || "scheduled"}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-foreground">{m.teacherName || m.teacher}</div>
                    <div className="text-xs text-muted-foreground">{m.subject}</div>
                    <div className="flex justify-between items-center border-t border-border pt-2 text-[10px] text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {m.dateTime || (m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" />
                        {m.type || "Video Call"}
                      </span>
                    </div>
                  </div>
                ))}
                {meetings.length === 0 && (
                  <EmptyState icon={Calendar} title="No PTM Booked" description="Use the button above to schedule a Parent-Teacher conference." />
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Attendance Tab ────────────────────────────────────────────────── */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Monthly Attendance Calendar">
              <AttendanceCalendar records={attendance} />
            </Panel>

            <div className="mt-6">
              <Panel title="Attendance Log — Recent Records">
                {attendance.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="No Attendance Records" description="Attendance data will appear here once available." />
                ) : (
                  <div className="divide-y divide-border">
                    {attendance.slice(0, 15).map((rec: any, i: number) => {
                      const s = rec.status?.toLowerCase() || "";
                      const color = s.includes("present")
                        ? "text-emerald-600 bg-emerald-50"
                        : s.includes("absent")
                        ? "text-red-600 bg-red-50"
                        : "text-amber-600 bg-amber-50";
                      return (
                        <div key={rec._id || i} className="flex items-center justify-between py-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {rec.date
                                ? new Date(rec.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
                                : "—"}
                            </div>
                            {rec.subject && <div className="text-xs text-muted-foreground">{rec.subject}</div>}
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${color}`}>
                            {rec.status || "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="Attendance Summary">
              <div className="space-y-4">
                {[
                  { label: "Present",  count: attendance.filter((a) => a.status?.toLowerCase().includes("present")).length, color: "bg-emerald-500", textColor: "text-emerald-600" },
                  { label: "Absent",   count: attendance.filter((a) => a.status?.toLowerCase().includes("absent")).length,  color: "bg-red-500",     textColor: "text-red-600"     },
                  { label: "Late",     count: attendance.filter((a) => a.status?.toLowerCase().includes("late")).length,    color: "bg-amber-500",   textColor: "text-amber-600"   },
                ].map(({ label, count, color, textColor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={textColor}>{count} days</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${totalAttDays ? (count / totalAttDays) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1">Overall Attendance Rate</div>
                  <div className={`text-2xl font-extrabold ${attendancePct >= 75 ? "text-emerald-600" : "text-red-600"}`}>
                    {attendancePct}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">{totalAttDays} total school days tracked</div>
                </div>
              </div>
            </Panel>

            <Panel title="Status Legend">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500" /> Present</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-500/20 border border-red-500" /> Absent</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500" /> Late Arrival</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-muted border border-border" /> No School / Weekend</div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Exam Schedule Tab ─────────────────────────────────────────────── */}
      {activeTab === "exams" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Panel title="Upcoming & Recent Examinations">
              {examSchedule.length === 0 ? (
                <EmptyState icon={BookOpen} title="No Exams Scheduled" description="Upcoming exams will appear here once scheduled by the school." />
              ) : (
                <div className="space-y-4">
                  {examSchedule.map((exam: any) => {
                    const isUpcoming = exam.status === "upcoming" || new Date(exam.date) >= new Date();
                    return (
                      <div
                        key={exam.id || exam._id}
                        className={`rounded-xl border p-4 ${
                          isUpcoming
                            ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30"
                            : "border-border bg-card/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{exam.subject}</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isUpcoming ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                              }`}>
                                {exam.examType || exam.type}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">Syllabus: {exam.syllabus || "As per curriculum"}</div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {exam.date ? new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {exam.time || "—"}
                              </span>
                              <span className="text-xs text-muted-foreground">Duration: {exam.duration || "—"}</span>
                              <span className="text-xs text-muted-foreground">Venue: {exam.venue || "—"}</span>
                            </div>
                          </div>
                          {exam.score && (
                            <div className="shrink-0 text-right">
                              <div className="text-[10px] text-muted-foreground uppercase">Score</div>
                              <div className="text-lg font-bold text-emerald-600">{exam.score}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Exam Tips & Prep">
              <div className="space-y-3 text-xs">
                {[
                  { emoji: "📚", tip: "Review all chapter summaries and key formulas 3 days before." },
                  { emoji: "😴", tip: "Ensure 8+ hours of sleep the night before exams." },
                  { emoji: "🥗", tip: "Eat a balanced breakfast on exam day." },
                  { emoji: "⏰", tip: "Arrive at the exam hall 15 minutes early." },
                  { emoji: "✏️", tip: "Read all questions carefully before attempting." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="text-muted-foreground leading-relaxed">{item.tip}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Behavior & Discipline Tab ─────────────────────────────────────── */}
      {activeTab === "behavior" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Behavior & Discipline Records">
              {disciplineRecords.length === 0 ? (
                <EmptyState icon={Shield} title="No Records" description="Behavior notes logged by teachers will appear here." />
              ) : (
                <div className="space-y-4">
                  {disciplineRecords.map((rec: any) => (
                    <div
                      key={rec.id || rec._id}
                      className={`rounded-xl border p-4 ${
                        rec.type === "Positive"
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                          : rec.type === "Warning"
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                          : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {rec.type === "Positive" ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : rec.type === "Warning" ? (
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm font-bold text-foreground">{rec.category}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              rec.type === "Positive"
                                ? "bg-emerald-100 text-emerald-700"
                                : rec.type === "Warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {rec.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                            <span>By: {rec.teacher}</span>
                            <span>{rec.date ? new Date(rec.date).toLocaleDateString() : "—"}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] text-muted-foreground uppercase">Action Taken</div>
                          <div className="text-xs font-semibold text-foreground mt-0.5">{rec.action || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div>
            <Panel title="Behavior Overview">
              <div className="space-y-4">
                {[
                  { label: "Positive Recognition", count: disciplineRecords.filter((r) => r.type === "Positive").length,  color: "bg-emerald-500", text: "text-emerald-600" },
                  { label: "Warnings Issued",       count: disciplineRecords.filter((r) => r.type === "Warning").length,   color: "bg-amber-500",   text: "text-amber-600"  },
                  { label: "Serious Incidents",      count: disciplineRecords.filter((r) => r.type === "Incident").length,  color: "bg-red-500",     text: "text-red-600"    },
                ].map(({ label, count, color, text }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      <span className={`text-sm font-bold ${text}`}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Achievements Tab ──────────────────────────────────────────────── */}
      {activeTab === "achievements" && (
        <div>
          {achievements.length === 0 ? (
            <EmptyState icon={Trophy} title="No Achievements Yet" description="Certificates and badges awarded to your child will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach: any) => (
                <div
                  key={ach.id || ach._id}
                  className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{ach.badge || "🏅"}</div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {ach.type}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-foreground mb-1">{ach.title}</div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ach.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-3">
                    <span>
                      Issued by: <span className="font-semibold text-foreground">{ach.issuer}</span>
                    </span>
                    <span>{ach.date ? new Date(ach.date).toLocaleDateString() : "—"}</span>
                  </div>
                  <button
                    onClick={() => toast.success(`Downloading ${ach.title} certificate...`)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-2 text-xs font-semibold transition-all group-hover:border-accent/30"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Certificate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PTM Modal ─────────────────────────────────────────────────────── */}
      {showPtmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowPtmModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Schedule PTM Conference</h2>
              <button onClick={() => setShowPtmModal(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleBookMeeting} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Select Teacher</label>
                <input name="teacher" required placeholder="Teacher name" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Subject</label>
                <input name="subject" required placeholder="e.g. Mathematics" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Preferred Date & Time</label>
                <input name="dateTime" type="datetime-local" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Conference Mode</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="type" value="Video Call" defaultChecked /> Virtual Video Call</label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="type" value="In-Person" /> In-Person Campus</label>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow active:scale-95 transition-all text-xs">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Report Card Modal ──────────────────────────────────────────────── */}
      {viewingReportCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setViewingReportCard(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border text-foreground font-serif animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start border-b-2 border-primary pb-3 font-sans">
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-primary">CAMPUS OS ACADEMY</h1>
                <p className="text-[9px] text-muted-foreground">Certified Term Record Archive</p>
              </div>
              <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">OFFICIAL TRANSCRIPT</span>
            </div>
            <div className="my-5 text-center font-sans">
              <h2 className="text-base font-bold text-foreground uppercase">{viewingReportCard.term || viewingReportCard.examName}</h2>
              <p className="text-xs text-muted-foreground">Student: <span className="font-semibold text-foreground">{studentName}</span></p>
            </div>
            {viewingReportCard.grades && (
              <table className="w-full text-left text-xs font-sans border-collapse mb-5">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-bold">
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(viewingReportCard.grades).map(([subj, gr]: any) => (
                    <tr key={subj} className="border-b border-border">
                      <td className="py-2 px-3">{subj}</td>
                      <td className="py-2 px-3 text-right font-bold text-accent">{gr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {viewingReportCard.summary && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs mb-5 font-sans leading-relaxed">
                <div className="font-bold text-foreground">Principal Remarks:</div>
                <p className="text-muted-foreground italic mt-0.5">"{viewingReportCard.summary}"</p>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-border pt-4 text-xs font-sans">
              <div className="flex items-center gap-1.5 font-semibold text-[oklch(0.45_0.15_155)]">
                <CheckCircle className="h-3.5 w-3.5" /> Digitally Verified
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Overall GPA</div>
                <div className="text-lg font-extrabold text-primary">{viewingReportCard.cgpa ?? viewingReportCard.gpa ?? "—"}</div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-border flex justify-end gap-2 font-sans">
              <button onClick={() => window.print()} className="rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground px-4 py-2 text-xs font-semibold shadow-sm">Print</button>
              <button onClick={() => setViewingReportCard(null)} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
