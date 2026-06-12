import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Upload, CheckCircle, Clock } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { fetchHomeworkItems, submitHomeworkAssignment } from "@/lib/homework-api";

export const Route = createFileRoute("/student/assignments")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [apiAssignments, setApiAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchHomeworkItems()
      .then((items) => {
        if (mounted) setApiAssignments(items || []);
      })
      .catch(() => {
        if (mounted) setApiAssignments([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const myAssignments = apiAssignments;

  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [submitRemarks, setSubmitRemarks] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionId) return;
    try {
      await submitHomeworkAssignment(activeSubmissionId, submitRemarks, submitFile || undefined);
      toast.success("Assignment submitted!", { description: "Your work has been uploaded." });
      setActiveSubmissionId(null);
      setSubmitRemarks("");
      setSubmitFile(null);
      // Refresh list
      const items = await fetchHomeworkItems();
      setApiAssignments(items || []);
    } catch (error) {
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div>
      <PageHeader title="Assignments" subtitle="View, submit, and track your homework" />
      {loading && <div className="text-sm text-muted-foreground">Loading assignments…</div>}
      <div className="space-y-4">
        {myAssignments.map((a) => {
          const assignmentId = a._id || a.id;
          const currentStudentId = user?.studentId || user?.id;
          const mySub = a.submissions?.find((s: { studentId: string }) => s.studentId === currentStudentId);
          const isGraded = mySub?.status === "graded" || mySub?.status === "REVIEWED";
          return (
            <div key={assignmentId} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                      {a.subject || a.subjectId || "Homework"}
                    </span>
                    <span className="text-xs text-muted-foreground">· Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "TBD"}</span>
                  </div>
                  <div className="text-base font-semibold">{a.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{a.description}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {a.maxScore ? `Max Score: ${a.maxScore} · ` : ""}By {a.createdBy || "Teacher"}
                  </div>
                </div>
                <div className="shrink-0">
                  {mySub ? (
                    <div className="text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isGraded ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-accent/10 text-accent"}`}
                      >
                        {isGraded ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            {mySub.score ?? mySub.marks ?? 0}/{a.maxScore ?? "—"}
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Submitted
                          </>
                        )}
                      </span>
                      {mySub.remarks && (
                        <div className="mt-2 text-xs text-muted-foreground max-w-[200px] italic">
                          Feedback: "{mySub.remarks}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveSubmissionId(assignmentId)}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {myAssignments.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No assignments"
            description="You're all caught up!"
          />
        )}
      </div>

      {activeSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border">
            <h2 className="text-lg font-semibold mb-4">Submit Assignment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your File</label>
                <input
                  type="file"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea
                  value={submitRemarks}
                  onChange={(e) => setSubmitRemarks(e.target.value)}
                  placeholder="Add any notes for the teacher..."
                  className="w-full h-24 rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubmissionId(null);
                    setSubmitRemarks("");
                    setSubmitFile(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Upload & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
