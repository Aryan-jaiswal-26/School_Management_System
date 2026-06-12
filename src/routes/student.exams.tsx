import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "My Exam Schedule · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "all">("my");

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await apiClient<any[]>("/exams");
      setExams(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load exams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const studentGrade = user?.className || "";
  
  // Filter exams that match the student's class name (case insensitive, sub-string matches allowed)
  const myExams = exams.filter((e: any) => {
    if (!studentGrade) return false;
    const examGrade = String(e.grade || "").toLowerCase();
    const cleanStudentGrade = studentGrade.toLowerCase();
    return examGrade.includes(cleanStudentGrade) || cleanStudentGrade.includes(examGrade);
  });

  const displayExams = tab === "my" ? myExams : exams;

  // Calculate stats
  const totalUpcoming = displayExams.filter((e) => new Date(e.startDate) >= new Date()).length;
  const nextExam = myExams
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const nextExamDateLabel = nextExam
    ? new Date(nextExam.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "None";

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Loading exam schedules...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Exam Schedule"
        subtitle="View dates, timings, and rooms for your academic assessments"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Total Scheduled"
          value={String(displayExams.length)}
          icon={CalendarDays}
          tone="info"
        />
        <StatCard
          label="My Next Exam"
          value={nextExamDateLabel}
          delta={nextExam ? nextExam.subject : "No exams left"}
          icon={Clock}
          tone={nextExam ? "warning" : "success"}
        />
        <StatCard
          label="Assigned Grade"
          value={studentGrade ? `Grade ${studentGrade}` : "General"}
          delta={user?.sectionName ? `Section ${user.sectionName}` : ""}
          icon={BookOpen}
        />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1 w-max">
        <button
          onClick={() => setTab("my")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all cursor-pointer ${tab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          My Assessments ({myExams.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all cursor-pointer ${tab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          All School Schedules ({exams.length})
        </button>
      </div>

      <Panel title={tab === "my" ? "My Grade's Assessments" : "All School Exam Timetables"}>
        {displayExams.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Exam Name</th>
                    <th className="pb-3 pr-4">Grade</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Duration & Timings</th>
                    <th className="pb-3 pr-4">Room / Hall</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayExams.map((e: any) => {
                    const isUpcoming = new Date(e.startDate) >= new Date();
                    return (
                      <tr key={e._id || e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-foreground flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-accent" />
                          {e.subject || "General"}
                        </td>
                        <td className="py-4 pr-4 font-medium">{e.name}</td>
                        <td className="py-4 pr-4 text-muted-foreground">{e.grade || "All Grades"}</td>
                        <td className="py-4 pr-4 font-mono text-xs">
                          {e.startDate ? new Date(e.startDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </td>
                        <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                          {e.startDate ? new Date(e.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} – {e.endDate ? new Date(e.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-4 pr-4 text-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {e.room || "—"}
                        </td>
                        <td className="py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isUpcoming ? "bg-accent/10 text-accent border border-accent/20" : "bg-muted text-muted-foreground"}`}>
                            {isUpcoming ? "Upcoming" : "Completed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {displayExams.map((e: any) => {
                const isUpcoming = new Date(e.startDate) >= new Date();
                return (
                  <div key={e._id || e.id} className="rounded-xl border border-border p-4 bg-card space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-accent uppercase tracking-wide">{e.subject || "General"}</span>
                        <h4 className="font-bold text-sm text-foreground mt-0.5">{e.name}</h4>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isUpcoming ? "bg-accent/10 text-accent border border-accent/20" : "bg-muted text-muted-foreground"}`}>
                        {isUpcoming ? "Upcoming" : "Completed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>{e.startDate ? new Date(e.startDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{e.startDate ? new Date(e.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>Room: {e.room || "—"} · Grade: {e.grade || "All"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={AlertCircle}
            title={tab === "my" ? "No assessments for your grade" : "No assessments scheduled"}
            description={tab === "my" ? "No exam timetable has been scheduled for your grade yet. Toggle 'All School Schedules' to view other classes." : "There are currently no exams scheduled for the school."}
          />
        )}
      </Panel>
    </div>
  );
}
