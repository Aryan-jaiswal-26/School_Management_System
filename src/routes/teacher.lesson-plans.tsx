import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { BookOpenCheck, Plus, FileText, Send, CheckCircle, Clock, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/lesson-plans")({
  head: () => ({ meta: [{ title: "Lesson Plans · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [objectives, setObjectives] = useState("");
  const [activities, setActivities] = useState("");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await apiClient<any>("/teacher/lesson-plans");
        setPlans(res?.data || []);
      } catch (err) {
        setPlans([]); // Fallback to empty
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !subject) {
      toast.error("Please fill in required fields");
      return;
    }
    
    // Optimistic UI update for mocked flow
    const newPlan = {
      id: Math.random().toString(),
      topic,
      subject,
      duration,
      objectives,
      status: "pending",
      date: new Date().toISOString()
    };
    
    setPlans([newPlan, ...plans]);
    toast.success("Lesson Plan Submitted", { description: "It is now pending Admin review." });
    setShowForm(false);
    setTopic(""); setSubject(""); setDuration(""); setObjectives(""); setActivities("");
  };

  const filteredPlans = plans.filter(p => p.topic.toLowerCase().includes(search.toLowerCase()) || p.subject.toLowerCase().includes(search.toLowerCase()));

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Topic Name *</label>
                <input required value={topic} onChange={e => setTopic(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="e.g. Thermodynamics" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Subject & Class *</label>
                <input required value={subject} onChange={e => setSubject(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="e.g. Physics 10-A" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Estimated Duration</label>
                <input value={duration} onChange={e => setDuration(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="e.g. 4 Hours" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Learning Objectives</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="What will the students learn?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Classroom Activities & Mappings</label>
              <textarea value={activities} onChange={e => setActivities(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="Mapping to standard curriculum guidelines..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-all">
                <Send className="h-4 w-4" /> Submit for Review
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
            placeholder="Search submitted plans..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
           <div className="flex justify-center items-center py-12 text-sm text-muted-foreground">
             <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
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
            <div key={plan.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:border-accent/50 transition-colors gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{plan.topic}</h4>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground/80">{plan.subject}</span> • {plan.duration || "N/A"} • Submitted {new Date(plan.date).toLocaleDateString()}
                  </div>
                  {plan.objectives && (
                    <div className="text-xs text-muted-foreground mt-2 line-clamp-1 border-l-2 border-border pl-2">
                      {plan.objectives}
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex justify-end md:justify-center">
                {plan.status === "approved" ? (
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.65_0.15_155)]/10 px-3 py-1 text-xs font-bold text-[oklch(0.45_0.15_155)]">
                     <CheckCircle className="h-3.5 w-3.5" /> Approved
                   </span>
                ) : (
                   <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.75_0.15_75)]/10 px-3 py-1 text-xs font-bold text-[oklch(0.50_0.15_75)]">
                     <Clock className="h-3.5 w-3.5" /> Pending Review
                   </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
