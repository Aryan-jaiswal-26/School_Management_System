import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, FileText, Eye, CheckCircle, Clock } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { fetchHomeworkItems, createHomeworkAssignment, gradeHomeworkSubmission } from "@/lib/homework-api";
import { useEffect } from "react";

export const Route = createFileRoute("/teacher/assignments")({ component: Page });

function Page() {
  const [showCreate, setShowCreate] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  
  const [assignments, setAssignments] = useState<any[]>([]);

  const loadAssignments = async () => {
    try {
      const items = await fetchHomeworkItems();
      setAssignments(items || []);
    } catch (err) {
      toast.error("Failed to load assignments");
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const viewing = assignments.find((a) => a.id === viewId);

  const handleGrade = async (assignmentId: string, submissionId: string, score: number) => {
    try {
      await gradeHomeworkSubmission(assignmentId, submissionId, score, "Good work!");
      toast.success("Submission graded");
      loadAssignments();
    } catch (err) {
      toast.error("Failed to grade submission");
    }
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Create, review, and grade student work"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                {a.subject?.name || a.subject}
              </span>
              <span className="text-xs text-muted-foreground">Due {new Date(a.dueDate || a.due_date).toLocaleDateString()}</span>
            </div>
            <div className="text-base font-semibold mb-1">{a.title}</div>
            <div className="text-sm text-muted-foreground mb-3">{a.description}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{a.submissions?.length || 0} submissions</span>
                <span>{(a.submissions || []).filter((s: any) => s.status === "graded" || s.status === "REVIEWED").length} graded</span>
              </div>
              <button
                onClick={() => setViewId(a.id)}
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                Review
              </button>
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No assignments"
            description="Create your first assignment."
          />
        )}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Submissions — {viewing.title}</h2>
              <button
                onClick={() => setViewId(null)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {viewing.submissions?.length > 0 ? (
              <div className="space-y-3">
                {viewing.submissions.map((s: any) => (
                  <div key={s.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{s.studentName || s.student_name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${(s.status === "graded" || s.status === "REVIEWED") ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-accent/10 text-accent"}`}
                      >
                        {(s.status === "graded" || s.status === "REVIEWED") ? `${s.score || s.marks}/${viewing.maxScore || viewing.max_score}` : "Pending"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.submittedAt || s.submitted_at || new Date()).toLocaleString() || "Not yet"}
                        {s.fileUrl ? (
                        <a href={s.fileUrl.startsWith('http') ? s.fileUrl : `http://localhost:5004${s.fileUrl.startsWith('/') ? '' : '/'}${s.fileUrl}`} target="_blank" className="text-primary underline">
                          View File
                        </a>
                      ) : s.fileName ? ` · ${s.fileName}` : ''}
                    </div>
                    {(s.status !== "graded" && s.status !== "REVIEWED") && (
                      <div className="mt-2 flex gap-2">
                        {[
                          viewing.maxScore || viewing.max_score || 100,
                          Math.round((viewing.maxScore || viewing.max_score || 100) * 0.8),
                          Math.round((viewing.maxScore || viewing.max_score || 100) * 0.6),
                        ].map((score) => (
                          <button
                            key={score}
                            onClick={() => handleGrade(viewing.id, s.id, score)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-all"
                          >
                            {score}/{viewing.maxScore || viewing.max_score || 100}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No submissions yet"
                description="Students haven't submitted work."
              />
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Assignment</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await createHomeworkAssignment({
                    title: fd.get("title") as string,
                    subjectName: fd.get("subject") as string,
                    className: fd.get("grade") as string,
                    sectionName: fd.get("section") as string,
                    description: fd.get("desc") as string,
                    dueDate: fd.get("due") as string,
                    maxScore: Number(fd.get("score")),
                  });
                  toast.success("Assignment created");
                  setShowCreate(false);
                  loadAssignments();
                } catch (err) {
                  toast.error("Failed to create assignment");
                }
              }}
              className="space-y-3"
            >
              {[
                ["title", "Title"],
                ["grade", "Class (e.g., Grade 10)"],
                ["section", "Section (e.g., A)"],
                ["subject", "Subject (e.g., Mathematics)"],
                ["desc", "Description"],
                ["due", "Due Date", "date"],
                ["score", "Max Score", "number"],
              ].map(([k, l, t]) => (
                <div key={k}>
                  <label className="mb-1 block text-sm font-medium">{l}</label>
                  <input
                    name={k}
                    type={t || "text"}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
