import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { Clock, TrendingUp, Award, Loader2, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/student/academics")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [gradeRecords, setGradeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "ledger">("calendar");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Report Card states
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [attendanceRes, gradesRes, examsRes] = await Promise.allSettled([
          apiClient<any[]>(`/attendance/student/${user.studentId}`),
          apiClient<any[]>(`/academics/grades/student/${user.studentId}`),
          apiClient<any[]>("/exams"),
        ]);

        if (attendanceRes.status === "fulfilled") {
          setAttendanceRecords(attendanceRes.value || []);
        }
        if (gradesRes.status === "fulfilled") {
          setGradeRecords(gradesRes.value || []);
        }
        if (examsRes.status === "fulfilled") {
          const list = Array.isArray(examsRes.value) ? examsRes.value : (examsRes.value as any)?.data || [];
          const published = list.filter((e: any) => e.status === "PUBLISHED");
          setExams(published);
          if (published.length > 0) {
            setSelectedExamId(published[0]._id || published[0].id);
          }
        }
      } catch (err) {
        console.error("Academics/attendance loading failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.studentId]);

  useEffect(() => {
    if (!selectedExamId || !user?.studentId) {
      setReportCard(null);
      return;
    }
    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        setReportError(null);
        const res = await apiClient<any>(`/exams/${selectedExamId}/report-card/${user.studentId}`);
        setReportCard(res?.data || res);
      } catch (err: any) {
        setReportError(err.message || "No report card available for this exam.");
        setReportCard(null);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [selectedExamId, user?.studentId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">
            Loading academics and attendance...
          </span>
        </div>
      </div>
    );
  }

  // --- Dynamic Attendance Processing ---
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (r) => r.status?.toLowerCase() === "present"
  ).length;
  const absentCount = attendanceRecords.filter(
    (r) => r.status?.toLowerCase() === "absent"
  ).length;
  const leaveCount = attendanceRecords.filter(
    (r) => r.status?.toLowerCase() === "leave" || r.status?.toLowerCase() === "half_day"
  ).length;
  const lateCount = attendanceRecords.filter(
    (r) => r.status?.toLowerCase() === "late"
  ).length;

  // Present + Late counts as present for percentage
  const effectivePresent = presentCount + lateCount;
  const attendancePercent =
    totalAttendance > 0
      ? Math.round((effectivePresent / totalAttendance) * 100)
      : 0;

  const attendanceData = [
    { name: "Present", value: effectivePresent, color: "oklch(0.55 0.13 255)" },
    { name: "Absent", value: absentCount, color: "oklch(0.58 0.22 27)" },
    { name: "Leave", value: leaveCount, color: "oklch(0.75 0.15 75)" },
  ].filter((d) => d.value > 0 || totalAttendance === 0);

  // --- Calendar Date Processing Helpers ---
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const getRecordForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceRecords.find((r) => r.session_date === dateStr);
  };

  // --- Dynamic Performance (Grades) Processing ---
  const totalGrades = gradeRecords.length;
  const averageScorePercent =
    totalGrades > 0
      ? Math.round(
          gradeRecords.reduce(
            (acc, r) => acc + (Number(r.score) / Number(r.max_score || 100)) * 100,
            0
          ) / totalGrades
        )
      : 0;

  // Group scores by subject for the bar chart
  const subjectAverages: Record<string, { subject: string; sum: number; count: number }> = {};
  gradeRecords.forEach((g) => {
    const subName = g.subject || "Subject";
    if (!subjectAverages[subName]) {
      subjectAverages[subName] = { subject: subName, sum: 0, count: 0 };
    }
    subjectAverages[subName].sum += (Number(g.score) / Number(g.max_score || 100)) * 100;
    subjectAverages[subName].count += 1;
  });

  const subjectChartData = Object.values(subjectAverages).map((s) => ({
    s: s.subject,
    score: Math.round(s.sum / s.count),
  }));

  // Fallback to empty display subjects if none found to keep layout
  const displaySubjects =
    subjectChartData.length > 0 ? subjectChartData : [];

  return (
    <div>
      <PageHeader
        title="Academics & Attendance"
        subtitle="Your academic performance and attendance analytics"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Attendance"
          value={totalAttendance > 0 ? `${attendancePercent}%` : "—%"}
          delta={totalAttendance > 0 ? (attendancePercent >= 75 ? "Above 75% target" : "Below 75% target") : "No logs recorded"}
          icon={Clock}
          tone={totalAttendance > 0 ? (attendancePercent >= 75 ? "success" : "warning") : "default"}
        />
        <StatCard
          label="Present Days"
          value={totalAttendance > 0 ? String(effectivePresent) : "0"}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Overall Score"
          value={totalGrades > 0 ? `${averageScorePercent}%` : "—%"}
          delta={totalGrades > 0 ? "Real term averages" : "No grades recorded"}
          icon={TrendingUp}
          tone={totalGrades > 0 ? "success" : "default"}
        />
        <StatCard 
          label="Class Rank" 
          value={totalGrades > 0 ? "#4" : "—"} 
          delta={totalGrades > 0 ? "Out of 42" : "No ranking data"} 
          icon={Award} 
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Attendance Breakdown">
          {totalAttendance > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {attendanceData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6">
                {attendanceData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <Clock className="h-8 w-8 mb-2 opacity-50" />
              <div className="text-sm font-medium">No attendance logs found</div>
              <div className="text-xs">Your attendance entries will show up here.</div>
            </div>
          )}
        </Panel>
        <Panel title="Subject-wise Performance">
          {totalGrades > 0 ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={displaySubjects}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.91 0.015 255)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="s"
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="score" fill="oklch(0.55 0.13 255)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
              <div className="text-sm font-medium">No academic grades found</div>
              <div className="text-xs">Your graded scores will show up here.</div>
            </div>
          )}
        </Panel>
      </div>

      {/* Monthly Attendance Ledger & Calendar */}
      <div className="mt-6">
        <Panel
          title="Attendance Ledger & Calendar"
          action={
            <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${viewMode === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode("ledger")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${viewMode === "ledger" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-3.5 w-3.5" />
                Daily Log
              </button>
            </div>
          }
        >
          {viewMode === "calendar" ? (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-sm font-bold text-foreground">
                  {calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                  <div key={dayName} className="text-xs font-semibold text-muted-foreground py-1">
                    {dayName}
                  </div>
                ))}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square bg-muted/5 rounded-xl border border-transparent" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const rec = getRecordForDay(day);
                  let cellClass = "bg-card hover:bg-muted/40 border-border";
                  let statusLabel = "";
                  let statusDotClass = "";

                  if (rec) {
                    const status = rec.status?.toLowerCase();
                    if (status === "present") {
                      cellClass = "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400";
                      statusLabel = "P";
                      statusDotClass = "bg-emerald-500";
                    } else if (status === "absent") {
                      cellClass = "bg-red-500/5 hover:bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-400";
                      statusLabel = "A";
                      statusDotClass = "bg-red-500";
                    } else if (status === "leave") {
                      cellClass = "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-400";
                      statusLabel = "L";
                      statusDotClass = "bg-amber-500";
                    } else if (status === "late") {
                      cellClass = "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/30 text-orange-800 dark:text-orange-400";
                      statusLabel = "T";
                      statusDotClass = "bg-orange-500";
                    }
                  }

                  return (
                    <div
                      key={day}
                      className={`group relative flex flex-col justify-between p-2 rounded-xl border aspect-square min-h-[50px] transition-all ${cellClass}`}
                    >
                      <div className="text-xs font-semibold leading-none text-left">{day}</div>
                      {rec && (
                        <div className="flex items-center justify-between mt-auto">
                          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{statusLabel}</span>
                        </div>
                      )}
                      
                      {rec && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-slate-950 p-2.5 text-left text-xs leading-normal text-white shadow-xl opacity-0 transition-opacity group-hover:opacity-100 dark:border-slate-800">
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span className="capitalize">{rec.status}</span>
                            <span className="text-[10px] text-slate-400">{rec.session_date}</span>
                          </div>
                          {rec.remarks && <div className="text-slate-300 italic mb-1">"{rec.remarks}"</div>}
                          <div className="text-[10px] text-slate-400">Marked by: {rec.marked_by_name || "System"}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Remarks</th>
                    <th className="pb-3">Marked By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((rec) => {
                      const status = rec.status?.toLowerCase();
                      let statusBadge = "bg-muted text-muted-foreground";

                      if (status === "present") statusBadge = "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
                      else if (status === "absent") statusBadge = "bg-red-500/10 text-red-600 border border-red-500/20";
                      else if (status === "leave") statusBadge = "bg-amber-500/10 text-amber-600 border border-amber-500/20";
                      else if (status === "late") statusBadge = "bg-orange-500/10 text-orange-600 border border-orange-500/20";

                      return (
                        <tr key={rec.id || rec._id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="py-3.5 pr-4 font-mono text-xs text-foreground">
                            {new Date(rec.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge}`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-xs italic text-muted-foreground">
                            {rec.remarks ? `"${rec.remarks}"` : "—"}
                          </td>
                          <td className="py-3.5 text-xs text-muted-foreground">
                            {rec.marked_by_name || "System"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No daily logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Marks & Report Card section */}
      <div className="mt-6 no-print">
        <Panel
          title="Term Gradebook & Report Card"
          action={
            exams.length > 0 ? (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground font-medium uppercase">Select Exam:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold outline-none focus:border-accent"
                >
                  {exams.map((ex) => (
                    <option key={ex._id || ex.id} value={ex._id || ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null
          }
        >
          {loadingReport ? (
            <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Retrieving report card details...</span>
            </div>
          ) : reportError || !reportCard ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {reportError || "No published report cards available. Exams must be marked and published by the administration."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Printable Report Card Frame */}
              <div className="printable-report-card border border-border/80 bg-card rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                {/* Print Banner/Watermark decoration */}
                <div className="absolute top-0 right-0 bg-accent/10 text-accent text-[9px] font-mono font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider no-print">
                  Student Certified Record
                </div>

                {/* Header */}
                <div className="text-center pb-6 border-b border-border">
                  <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">Campus International School</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Official Student Achievement Record · Academic Year 2026-2027</p>
                </div>

                {/* Info Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-6 text-sm border-b border-border/50 bg-muted/10 px-4 rounded-xl mt-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Student Name</span>
                    <strong className="text-foreground font-bold">{user?.name || "Aarav Sharma"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Student ID / Code</span>
                    <strong className="text-foreground font-bold font-mono">{user?.studentCode || "STD-2026-092"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Grade & Division</span>
                    <strong className="text-foreground font-bold">Grade {user?.className || "10"} - {user?.sectionName || "A"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Assessment Term</span>
                    <strong className="text-foreground font-bold">{reportCard.examDetails?.name || "Term Exam"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Completed Date</span>
                    <strong className="text-foreground font-bold font-mono">
                      {reportCard.examDetails?.endDate ? new Date(reportCard.examDetails.endDate).toLocaleDateString() : new Date().toLocaleDateString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Record Status</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ● Published
                    </span>
                  </div>
                </div>

                {/* Results Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 pr-4">Code</th>
                        <th className="pb-3 pr-4">Subject</th>
                        <th className="pb-3 pr-4 text-right">Marks</th>
                        <th className="pb-3 pr-4 text-center">Grade</th>
                        <th className="pb-3">Teacher Feedback / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.results?.map((res: any, idx: number) => (
                        <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/5 transition-colors">
                          <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-muted-foreground">{res.subjectCode || "SUB"}</td>
                          <td className="py-3.5 pr-4 font-semibold text-foreground">{res.subjectName}</td>
                          <td className="py-3.5 pr-4 text-right font-mono font-medium">{res.marksObtained} / {res.maxMarks}</td>
                          <td className="py-3.5 pr-4 text-center">
                            <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold text-center ${res.grade === "A+" || res.grade === "A" ? "bg-emerald-500/10 text-emerald-600" : res.grade === "F" ? "bg-red-500/10 text-red-600" : "bg-accent/10 text-accent"}`}>
                              {res.grade}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs text-muted-foreground italic font-medium">
                            {res.remarks ? `"${res.remarks}"` : "Satisfactory performance."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary block */}
                <div className="mt-6 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="bg-muted px-4 py-2.5 rounded-lg text-center">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider block mb-0.5 text-[9px]">Total Marks</span>
                      <strong className="text-sm font-bold text-foreground font-mono">{reportCard.overall?.totalObtained} / {reportCard.overall?.totalMax}</strong>
                    </div>
                    <div className="bg-muted px-4 py-2.5 rounded-lg text-center">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider block mb-0.5 text-[9px]">Percentage</span>
                      <strong className="text-sm font-bold text-foreground font-mono">{reportCard.overall?.percentage}%</strong>
                    </div>
                    <div className="bg-muted px-4 py-2.5 rounded-lg text-center">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider block mb-0.5 text-[9px]">Average GPA</span>
                      <strong className="text-sm font-bold text-foreground font-mono">{reportCard.overall?.averageGPA} / 4.00</strong>
                    </div>
                    <div className="bg-muted px-4 py-2.5 rounded-lg text-center">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider block mb-0.5 text-[9px]">Overall Grade</span>
                      <strong className="text-sm font-bold text-foreground font-mono">{reportCard.overall?.overallGrade}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 text-xs transition-transform active:scale-95 cursor-pointer no-print shadow-sm uppercase tracking-wider"
                  >
                    Print Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-card, .printable-report-card * {
            visibility: visible;
          }
          .printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
