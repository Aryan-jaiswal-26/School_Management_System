import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  CalendarDays,
  Wallet,
  TrendingUp,
  Bus,
  Clock,
  Loader2,
  PartyPopper,
  Video,
  MonitorUp,
  ExternalLink,
  PlayCircle,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user } = useAuth();

  // Local state for fetched backend data
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [gradeRecords, setGradeRecords] = useState<any[]>([]);
  const [timetableRecords, setTimetableRecords] = useState<any[]>([]);
  const [homeworkRecords, setHomeworkRecords] = useState<any[]>([]);
  const [busRoute, setBusRoute] = useState<any>(null);
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Concurrent fetching for premium efficiency
        const [attendanceRes, gradesRes, timetableRes, homeworkRes, transportRes, feesRes, liveClassRes] = await Promise.allSettled([
          apiClient<any[]>(`/attendance/student/${user.studentId}`),
          apiClient<any[]>(`/academics/grades/student/${user.studentId}`),
          apiClient<any[]>("/academics/timetable"),
          apiClient<any[]>("/homework"),
          apiClient<any[]>("/transport/routes"),
          apiClient<any[]>(`/fees/student/${user.studentId}`),
          apiClient<any[]>("/live-classes?limit=10"),
        ]);

        if (attendanceRes.status === "fulfilled") {
          setAttendanceRecords(attendanceRes.value || []);
        }
        if (gradesRes.status === "fulfilled") {
          setGradeRecords(gradesRes.value || []);
        }
        if (timetableRes.status === "fulfilled") {
          setTimetableRecords(timetableRes.value || []);
        }
        if (homeworkRes.status === "fulfilled") {
          setHomeworkRecords(homeworkRes.value || []);
        }
        if (transportRes.status === "fulfilled") {
          const routes = transportRes.value || [];
          setBusRoute(routes[0] || null);
        }
        if (feesRes.status === "fulfilled") {
          setFeeRecords(feesRes.value || []);
        }
        if (liveClassRes.status === "fulfilled") {
          setLiveClasses(liveClassRes.value || []);
        }
      } catch (err) {
        console.error("Dashboard details loading failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.studentId]);

  // --- Dynamic Attendance Processing ---
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status?.toLowerCase() === "present").length;
  const absentCount = attendanceRecords.filter((r) => r.status?.toLowerCase() === "absent").length;
  const leaveCount = attendanceRecords.filter(
    (r) => r.status?.toLowerCase() === "leave" || r.status?.toLowerCase() === "half_day"
  ).length;
  const lateCount = attendanceRecords.filter((r) => r.status?.toLowerCase() === "late").length;

  const attendancePercent =
    totalAttendance > 0
      ? Math.round(((presentCount + lateCount) / totalAttendance) * 100)
      : 0;

  const radialData = [{ name: "Attendance", value: attendancePercent, fill: "oklch(0.55 0.13 255)" }];

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

  // Group real scores by Term for plotting performance trends
  let gradesChartData: { test: string; score: number }[] = [];

  if (totalGrades > 0) {
    const termScores: Record<string, { term: string; sum: number; count: number }> = {};
    gradeRecords.forEach((g) => {
      const term = g.term || "Test";
      if (!termScores[term]) {
        termScores[term] = { term, sum: 0, count: 0 };
      }
      termScores[term].sum += (Number(g.score) / Number(g.max_score || 100)) * 100;
      termScores[term].count += 1;
    });

    gradesChartData = Object.values(termScores).map((t) => ({
      test: t.term,
      score: Math.round(t.sum / t.count),
    }));
  }

  // --- Dynamic Timetable Processing ---
  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const filteredTimetable = timetableRecords
    .filter((t) => t.dayOfWeek?.toLowerCase() === todayDay.toLowerCase())
    .map((t) => {
      const teacherName = t.teacherId?.userId
        ? `${t.teacherId.userId.firstName || ""} ${t.teacherId.userId.lastName || ""}`.trim()
        : "Faculty";
      return {
        time: t.startTime || "09:00",
        subject: t.subjectId?.name || "Academics",
        room: t.room || "101",
        teacher: teacherName,
      };
    });

  // --- Dynamic Homework/Assignments Processing ---
  const displayAssignments = homeworkRecords.slice(0, 4).map((h) => {
    const hasSubmitted = h.submissions?.some(
      (s: any) => s.studentId === user?.studentId || s.studentId === user?.id
    );
    return {
      subject: h.subjectId?.name || h.subject || "Homework",
      title: h.title,
      due: h.dueDate ? new Date(h.dueDate).toLocaleDateString() : "Pending",
      status: hasSubmitted ? "submitted" : "pending",
    };
  });

  const pendingAssignmentsCount = displayAssignments.filter((a) => a.status === "pending").length;

  // --- Dynamic Fees Dues Processing ---
  const totalDue = feeRecords.reduce(
    (a, f) => a + ((f.amount || f.totalAmount || 0) - (f.discountAmount || 0) - (f.paidAmount || f.paid || 0)),
    0
  );
  const unpaidFees = feeRecords.filter(
    (f) => ((f.amount || f.totalAmount || 0) - (f.discountAmount || 0) - (f.paidAmount || f.paid || 0)) > 0
  );
  const closestDueDate =
    unpaidFees.length > 0 && unpaidFees[0].dueDate
      ? new Date(unpaidFees[0].dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";
  const feeDelta = totalDue > 0 ? `Due ${closestDueDate}` : "All dues cleared";
  const liveSessions = liveClasses.filter((session) => session.status === "LIVE" || session.status === "SCHEDULED" || (session.status === "ENDED" && session.recordingUrl));

  const openLiveClass = (session: any) => {
    const target = session.meetingLink || "https://meet.google.com/new";
    window.open(target, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Loading student dashboard...</span>
        </div>
      </div>
    );
  }

  // Check for birthday
  const today = new Date();
  const isBirthday = user?.dob && (() => {
    const dob = new Date(user.dob);
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
  })();

  return (
    <div>
      {isBirthday && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <PartyPopper className="h-6 w-6 animate-bounce" />
          <div className="text-center">
            <h3 className="font-bold text-lg">Happy Birthday, {user?.name}! 🎉</h3>
            <p className="text-sm opacity-90">Wishing you a fantastic day ahead from everyone at the school!</p>
          </div>
          <PartyPopper className="h-6 w-6 animate-bounce" />
        </div>
      )}
      <PageHeader
        title={`Hi ${user?.name || "Student"} 👋`}
        subtitle={`Here's everything you need today — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        actions={
          <button className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
            View timetable
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={totalAttendance > 0 ? `${attendancePercent}%` : "—%"}
          delta={totalAttendance > 0 ? (attendancePercent >= 75 ? "Above 75% target" : "Below 75% target") : "No logs recorded"}
          icon={Clock}
          tone={totalAttendance > 0 ? (attendancePercent >= 75 ? "success" : "warning") : "default"}
        />
        <StatCard
          label="Pending assignments"
          value={String(pendingAssignmentsCount)}
          delta={`${homeworkRecords.length} total homework tasks`}
          icon={ClipboardList}
          tone={pendingAssignmentsCount > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Average score"
          value={totalGrades > 0 ? `${averageScorePercent}%` : "—%"}
          delta={totalGrades > 0 ? "Based on recorded terms" : "No grades recorded"}
          icon={TrendingUp}
          tone={totalGrades > 0 ? "info" : "default"}
        />
        <StatCard
          label="Fee dues"
          value={`₹${totalDue.toLocaleString()}`}
          delta={feeDelta}
          icon={Wallet}
          tone={totalDue > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Attendance summary">
          <div className="h-56">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-44 text-center">
            <div className="text-3xl font-bold text-foreground">
              {totalAttendance > 0 ? `${attendancePercent}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Present this term</div>
          </div>
          <div className="mt-32 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-muted p-2">
              <div className="font-semibold text-foreground">{presentCount}</div>
              Present
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="font-semibold text-foreground">{absentCount}</div>
              Absent
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="font-semibold text-foreground">{leaveCount}</div>
              Leave
            </div>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel
            title="Performance trend"
            action={<span className="text-xs text-muted-foreground">All subjects average</span>}
          >
            {totalGrades > 0 ? (
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={gradesChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.91 0.015 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="test"
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
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="oklch(0.55 0.13 255)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "oklch(0.55 0.13 255)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium">No grades recorded yet</div>
                <div className="text-xs">Grades will appear here once exams are graded by a teacher.</div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Today's classes"
            action={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          >
            {filteredTimetable.length > 0 ? (
              <ul className="divide-y divide-border">
                {filteredTimetable.map((c, idx) => (
                  <li key={idx} className="flex items-center gap-4 py-3">
                    <div className="w-16 shrink-0 text-sm font-semibold text-accent">{c.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{c.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.teacher} · Room {c.room}
                      </div>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      60 min
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium">No classes scheduled for today</div>
                <div className="text-xs">Enjoy your day off!</div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Live classes" action={<MonitorUp className="h-4 w-4 text-muted-foreground" />}>
            {liveSessions.length > 0 ? (
              <ul className="space-y-3">
                {liveSessions.slice(0, 3).map((session) => (
                  <li key={session.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{session.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.subject} · {session.className || "All classes"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          session.status === "LIVE"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : session.status === "ENDED"
                            ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-muted-foreground">
                        {session.teacherName || "Teacher"} · {new Date(session.scheduledAt).toLocaleString()}
                      </div>
                      {session.status === "ENDED" ? (
                        <button
                          onClick={() => window.open(session.recordingUrl, "_blank", "noopener,noreferrer")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Watch Replay
                        </button>
                      ) : (
                        <button
                          onClick={() => openLiveClass(session)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {session.status === "LIVE" ? "Join" : "View"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Video className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium">No live classes right now</div>
                <div className="text-xs">Your teacher will publish Meet links here when class starts.</div>
              </div>
            )}
          </Panel>

          <Panel title="Assignments">
            {displayAssignments.length > 0 ? (
              <ul className="space-y-3">
                {displayAssignments.map((a, idx) => (
                  <li key={idx} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                        {a.subject}
                      </div>
                      <span className="text-xs text-[oklch(0.50_0.15_75)]">
                        {a.due}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">{a.title}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 mb-2 opacity-50" />
                <div className="text-sm font-medium">All caught up!</div>
                <div className="text-xs">No pending assignments.</div>
              </div>
            )}
          </Panel>

          <Panel title="Bus tracker">
            {busRoute ? (
              <div className="flex items-center gap-3 rounded-md bg-muted p-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Route {busRoute.routeNumber || busRoute.routeNo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bus {busRoute.vehicleNumber || busRoute.busNo} · Active
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted-foreground justify-center">
                <Bus className="h-4 w-4 opacity-50" />
                <span className="text-xs font-medium">No bus route assigned</span>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
