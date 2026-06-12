import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Plus, Users, Video } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/ptm")({
  head: () => ({ meta: [{ title: "PTM Scheduler · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await apiClient<any>("/ptm");
      setMeetings(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch PTMs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <div>
      <PageHeader
        title="Parent-Teacher Meetings"
        subtitle="Schedule and manage meeting slots with parents"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Create Schedule
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-muted-foreground p-4">Loading schedules...</p>
        ) : meetings.length === 0 ? (
          <div className="col-span-full">
             <EmptyState
                icon={CalendarDays}
                title="No Meetings Scheduled"
                description="Create a schedule block for parents to book slots."
             />
          </div>
        ) : (
          meetings.map((m) => (
            <Panel key={m._id} title={m.title}>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(m.date).toLocaleDateString()}
                     </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {m.startTime} - {m.endTime}
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                     <Users className="h-4 w-4 text-primary" />
                     <span className="font-medium">
                        Teacher: {m.teacherId?.firstName} {m.teacherId?.lastName}
                     </span>
                  </div>

                  <div className="space-y-2 mt-4">
                     <h4 className="text-xs font-semibold text-muted-foreground uppercase">Slots</h4>
                     <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                        {m.slots.map((s: any) => (
                           <div key={s._id} className={`p-2 rounded border text-xs flex justify-between items-center ${s.status === 'AVAILABLE' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-primary/5 border-primary/20'}`}>
                              <span className="font-mono font-medium">{s.time}</span>
                              <span>{s.status === 'AVAILABLE' ? 'Available' : 'Booked'}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </Panel>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">New PTM Schedule</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground">
                 Close
              </button>
            </div>
            
            <form onSubmit={async (e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               try {
                  await apiClient("/ptm", {
                     method: "POST",
                     data: {
                        title: fd.get("title"),
                        date: fd.get("date"),
                        startTime: fd.get("startTime"),
                        endTime: fd.get("endTime"),
                        slotDurationMinutes: Number(fd.get("duration")),
                     }
                  });
                  toast.success("Schedule created");
                  setShowAdd(false);
                  fetchMeetings();
               } catch (err) {
                  toast.error("Failed to create schedule");
               }
            }} className="space-y-4">
               <div>
                  <label className="text-sm font-medium">Title</label>
                  <input name="title" required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" placeholder="e.g. Fall Parent-Teacher Conferences" />
               </div>
               <div>
                  <label className="text-sm font-medium">Date</label>
                  <input name="date" type="date" required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-medium">Start Time</label>
                     <input name="startTime" type="time" required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" />
                  </div>
                  <div>
                     <label className="text-sm font-medium">End Time</label>
                     <input name="endTime" type="time" required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" />
                  </div>
               </div>
               <div>
                  <label className="text-sm font-medium">Slot Duration (Minutes)</label>
                  <input name="duration" type="number" defaultValue={15} required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm" />
               </div>
               <button type="submit" className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground">
                  Create Slots
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
