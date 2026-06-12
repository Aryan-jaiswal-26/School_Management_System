import { createFileRoute } from '@tanstack/react-router'
import { useTeacherData } from '@/hooks/useTeacherData';
import { useAuth } from '@/lib/auth-context';
import { fetchExamInsights } from '@/lib/teacher-api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader, Panel } from "@/components/module-shell";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/teacher/exams")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { data, loading: insightsLoading, error, retry } = useTeacherData(() =>
    fetchExamInsights(user?.id ?? "")
  );
  const insights = data ?? { overall: [], examwise: [], subwise: [] };
  const overall = insights.overall ?? [];
  const examwise = insights.examwise ?? [];
  const subwise = insights.subwise ?? [];

  const [view, setView] = useState<"overall" | "examwise" | "subjectwise" | "marks">(
    "overall"
  );

  const [selectedClass, setSelectedClass] = useState("10-A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const res: any = await apiClient("/students?limit=100");
        setStudents(res?.data || []);
      } catch (err) {
        toast.error("Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const [grade, section] = selectedClass.split("-");
  const classStudents = students.filter(
    (s) =>
      (s.classDetails?.name || "").includes(grade || "") &&
      (s.sectionDetails?.name || "") === section
  );

  useEffect(() => {
    const initScores: Record<string, string> = {};
    const initRemarks: Record<string, string> = {};
    classStudents.forEach((s) => {
      initScores[s._id] = "";
      initRemarks[s._id] = "";
    });
    setScores(initScores);
    setRemarks(initRemarks);
  }, [selectedClass, students, classStudents]);

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      const payload = classStudents.map((s) => ({
        student_id: s._id,
        student_name: `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim(),
        subject: selectedSubject,
        grade,
        section,
        score: Number(scores[s._id] || 0),
        max_score: 100,
        term: selectedTerm,
        remarks: remarks[s._id] || "",
      }));

      await apiClient("/academics/grades/bulk", {
        method: "POST",
        data: payload,
      });

      toast.success("Marks recorded successfully!", {
        description: `${selectedSubject} marks saved for ${selectedClass}.`,
      });
    } catch (err) {
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (insightsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <span className="text-destructive">Failed to load insights: {error.message}</span>
        <button
          onClick={retry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Exam & Performance Center" subtitle="Analytics dashboards and marks entry portal" />
      
      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1 flex-wrap sm:flex-nowrap">
        {(
          [
            ["overall", "Overall"],
            ["examwise", "Exam-wise"],
            ["subjectwise", "Subject-wise"],
            ["marks", "Marks Entry"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              view === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {view === "overall" && (
        <Panel title="Class-wise Average">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={overall}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis dataKey="cls" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[60, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="avg" fill="oklch(0.55 0.13 255)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {view === "examwise" && (
        <Panel title="Exam Trend">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={examwise}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis dataKey="exam" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[60, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="oklch(0.55 0.13 255)"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {view === "subjectwise" && (
        <Panel title="Topic-wise Performance">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={subwise} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  horizontal={false}
                />
                <YAxis
                  dataKey="sub"
                  type="category"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <XAxis
                  type="number"
                  domain={[60, 100]}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="avg" fill="oklch(0.65 0.15 155)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {view === "marks" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Class</label>
              <div className="flex gap-2 flex-wrap">
                {["10-A", "10-B", "9-A", "9-B"].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                      selectedClass === cls ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent"
              >
                {["Mathematics", "Science", "English", "History"].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent"
              >
                {["Term 1", "Term 2", "Midterm", "Finals"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <Panel
            title={`Enter Marks — ${selectedSubject} (${selectedTerm})`}
            action={
              <button
                onClick={handleSaveMarks}
                disabled={saving || studentsLoading || classStudents.length === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Marks
              </button>
            }
          >
            {studentsLoading ? (
              <div className="flex justify-center items-center py-12 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading student list...
              </div>
            ) : (
              <div className="space-y-3">
                {classStudents.map((s) => {
                  const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim();
                  return (
                    <div
                      key={s._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border p-3 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                          {fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{fullName}</div>
                          <div className="text-xs text-muted-foreground">Admission #{s.admissionNumber}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={scores[s._id] || ""}
                            onChange={(e) =>
                              setScores((prev) => ({ ...prev, [s._id]: e.target.value }))
                            }
                            className="h-9 w-20 rounded-md border border-border bg-card px-2.5 text-center text-sm font-medium outline-none focus:border-accent"
                          />
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Remarks..."
                          value={remarks[s._id] || ""}
                          onChange={(e) =>
                            setRemarks((prev) => ({ ...prev, [s._id]: e.target.value }))
                          }
                          className="h-9 w-full sm:w-48 rounded-md border border-border bg-card px-3 text-xs outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  );
                })}
                {classStudents.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No students found in {selectedClass}.
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
