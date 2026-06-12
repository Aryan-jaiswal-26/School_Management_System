import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { BookOpenCheck, Plus, FileText, Send, CheckCircle, Clock, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/lesson-plans")({
  head: () => ({ meta: [{ title: "Lesson Plans · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [plans, setPlans] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [objectives, setObjectives] = useState("");
  const [activities, setActivities] = useState("");
  const [materials, setMaterials] = useState("");
  const [homework, setHomework] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchPlans() {
    try {
      setLoading(true);
      const res = await apiClient<any>("/lesson-plans");
      setPlans(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      toast.error("Failed to load lesson plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();

    async function fetchMetadata() {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          apiClient<any>("/academics/classes?limit=100"),
          apiClient<any>("/academics/subjects"),
        ]);
        setClasses(Array.isArray(classesRes) ? classesRes : classesRes?.data || []);
        setSubjects(Array.isArray(subjectsRes) ? subjectsRes : subjectsRes?.data || []);
      } catch (err) {
        console.error("Failed to load classes or subjects", err);
      }
    }
    fetchMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !classId || !subjectId || !weekStartDate) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setSubmitting(true);
      // Split newline fields into arrays
      const objectivesArray = objectives.split("\n").map(o => o.trim()).filter(Boolean);
      const activitiesArray = activities.split("\n").map(a => a.trim()).filter(Boolean);
      const materialsArray = materials.split("\n").map(m => m.trim()).filter(Boolean);

      const payload = {
        title,
        classId,
        subjectId,
        weekStartDate: new Date(weekStartDate).toISOString(),
        objectives: objectivesArray,
        activities: activitiesArray,
        materials: materialsArray,
        homework,
      };

      await apiClient("/lesson-plans", {
        method: "POST",
        data: payload,
      });

      toast.success("Lesson Plan Created", { description: "Your lesson plan has been created as draft." });
      setShowForm(false);
      
      // Reset form
      setTitle("");
      setClassId("");
      setSubjectId("");
      setWeekStartDate("");
      setObjectives("");
      setActivities("");
      setMaterials("");
      setHomework("");

      // Refresh list
      await fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lesson plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (planId: string) => {
    try {
      await apiClient(`/lesson-plans/${planId}/submit`, {
        method: "PATCH",
      });
      toast.success("Submitted for Review", { description: "The plan status is now submitted." });
      await fetchPlans();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit lesson plan");
    }
  };

  const filteredPlans = plans.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.classId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.subjectId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Lesson Plans & Curriculum" 
        subtitle="Draft your lesson plans, map them to the curriculum, and submit for academic review." 
        actions={
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-all">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        }
      />

      {showForm && (
        <Panel title="Draft New Lesson Plan" className="animate-in slide-in-from-top-4 fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Topic / Title *</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="e.g. Thermodynamics Introduction" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Class *</label>
                <select required value={classId} onChange={e => setClassId(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Subject *</label>
                <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent">
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Week Start Date *</label>
                <input required type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Learning Objectives (One per line)</label>
                <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="Students will understand..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Classroom Activities (One per line)</label>
                <textarea value={activities} onChange={e => setActivities(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="Activity details..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Required Materials (One per line)</label>
                <textarea value={materials} onChange={e => setMaterials(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="Projector, Lab Equipment..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Homework Assignment Description</label>
              <input value={homework} onChange={e => setHomework(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="Read Chapter 4 and solve exercises 1-5" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors border border-border" disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-all" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Create Draft
              </button>
            </div>
          </form>
        </Panel>
      )}

      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans by title, class, or subject..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
           <div className="flex justify-center items-center py-12 text-sm text-muted-foreground">
             <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading lesson plans...
           </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/30">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">No Lesson Plans</div>
            <div className="text-xs text-muted-foreground mt-1 max-w-sm">
              You haven't submitted any lesson plans yet, or none match your search. Create one to get started.
            </div>
          </div>
        ) : (
          filteredPlans.map((plan: any) => (
            <div key={plan._id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:border-accent/50 transition-colors gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{plan.title}</h4>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground/80">{plan.classId?.name || "No Class"} • {plan.subjectId?.name || "No Subject"}</span> • Week: {new Date(plan.weekStartDate).toLocaleDateString()}
                  </div>
                  {plan.objectives && plan.objectives.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 line-clamp-1 border-l-2 border-border pl-2">
                      <strong>Objectives:</strong> {plan.objectives.join(", ")}
                    </div>
                  )}
                  {plan.adminFeedback && (
                    <div className="text-xs text-destructive mt-1 bg-destructive/5 p-2 rounded border border-destructive/10">
                      <strong>Feedback:</strong> {plan.adminFeedback}
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3 justify-end md:justify-center">
                {plan.status === "approved" ? (
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.65_0.15_155)]/10 px-3 py-1 text-xs font-bold text-[oklch(0.45_0.15_155)]">
                     <CheckCircle className="h-3.5 w-3.5" /> Approved
                   </span>
                ) : plan.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                    <CheckCircle className="h-3.5 w-3.5" /> Rejected
                  </span>
                ) : plan.status === "submitted" ? (
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.75_0.15_75)]/10 px-3 py-1 text-xs font-bold text-[oklch(0.50_0.15_75)]">
                     <Clock className="h-3.5 w-3.5" /> Pending Review
                   </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                      Draft
                    </span>
                    <button onClick={() => handleSubmitForReview(plan._id)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-all flex items-center gap-1">
                      <Send className="h-3 w-3" /> Submit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
