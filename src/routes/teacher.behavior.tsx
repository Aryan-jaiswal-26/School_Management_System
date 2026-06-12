import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { Star, ShieldAlert, Award, AlertTriangle, Send, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/behavior")({
  head: () => ({ meta: [{ title: "Behavior & Rewards · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentName, setStudentName] = useState("");
  const [type, setType] = useState<"positive" | "negative">("positive");
  const [description, setDescription] = useState("");
  const [notifyParent, setNotifyParent] = useState(false);

  useEffect(() => {
    async function fetchBehavior() {
      try {
        const res = await apiClient<any>("/teacher/behavior");
        setLogs(res?.data || []);
      } catch (err) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBehavior();
  }, []);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !description) {
      toast.error("Please provide student name and description");
      return;
    }

    const newLog = {
      id: Math.random().toString(),
      studentName,
      type,
      description,
      date: new Date().toISOString(),
      notified: notifyParent
    };

    setLogs([newLog, ...logs]);
    toast.success(`${type === 'positive' ? 'Merit Badge' : 'Disciplinary Incident'} Recorded`, {
      description: notifyParent ? "Parent notification triggered automatically." : "Saved to student profile."
    });
    
    setStudentName(""); setDescription(""); setNotifyParent(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Behavior & Rewards" 
        subtitle="Log student incidents, issue merit badges, and track disciplinary actions." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <Panel title="Log New Entry">
            <form onSubmit={handleLog} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Student Name</label>
                <input required value={studentName} onChange={e => setStudentName(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" placeholder="e.g. Aarav Sharma" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setType("positive")} className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all ${type === 'positive' ? 'border-[oklch(0.65_0.15_155)] bg-[oklch(0.65_0.15_155)]/10 text-[oklch(0.45_0.15_155)]' : 'border-border hover:bg-muted text-muted-foreground'}`}>
                    <Award className="h-4 w-4" /> Positive
                  </button>
                  <button type="button" onClick={() => setType("negative")} className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all ${type === 'negative' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border hover:bg-muted text-muted-foreground'}`}>
                    <AlertTriangle className="h-4 w-4" /> Negative
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Incident Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder={type === 'positive' ? "e.g. Excellent teamwork during science project." : "e.g. Disruptive behavior during lecture."} />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border bg-muted/50 p-3">
                <input type="checkbox" checked={notifyParent} onChange={(e) => setNotifyParent(e.target.checked)} className="h-4 w-4 accent-primary rounded border-border" />
                <div className="text-xs font-semibold text-foreground">
                  Notify Parents
                  <div className="text-[10px] text-muted-foreground font-normal">Send automated SMS/Email alert to guardians.</div>
                </div>
              </label>

              <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 transition-all">
                <Send className="h-4 w-4" /> Submit Log
              </button>
              
              {type === 'negative' && (
                <button type="button" onClick={() => toast("Counselor Referral Sent")} className="w-full rounded-lg bg-background border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted flex items-center justify-center gap-2 transition-all mt-2">
                  <ShieldAlert className="h-3.5 w-3.5" /> Forward to Counselor
                </button>
              )}
            </form>
          </Panel>
        </div>

        {/* History Log */}
        <div className="lg:col-span-2">
          <Panel title="Recent Logs & Actions">
            {loading ? (
              <div className="flex justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading records...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                  <Star className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">No Records Yet</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Behavior logs and merit points you assign will appear here.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${log.type === 'positive' ? 'bg-[oklch(0.65_0.15_155)]/10 text-[oklch(0.45_0.15_155)]' : 'bg-destructive/10 text-destructive'}`}>
                      {log.type === 'positive' ? <Award className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{log.studentName}</h4>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md border border-border border-dashed">
                        {log.description}
                      </p>
                      {log.notified && (
                        <div className="text-[10px] text-accent font-semibold mt-2 flex items-center gap-1 bg-accent/10 w-fit px-2 py-0.5 rounded">
                          <Send className="h-3 w-3" /> Parent Notified
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
