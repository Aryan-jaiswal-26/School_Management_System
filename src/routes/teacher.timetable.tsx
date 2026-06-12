import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { Clock, MapPin, CalendarDays, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/timetable")({
  head: () => ({ meta: [{ title: "My Timetable · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
      try {
        const res = await apiClient<any>("/teacher/timetable");
        setSchedule(res?.data || []);
      } catch (err) {
        console.error("Failed to load timetable", err);
        setSchedule([]); // default empty state
      } finally {
        setLoading(false);
      }
    }
    fetchTimetable();
  }, []);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Timetable" 
        subtitle="View your assigned classes, subjects, and periods for the week." 
      />

      <Panel title="Weekly Class Schedule" action={<CalendarDays className="h-4 w-4 text-muted-foreground" />}>
        {loading ? (
          <div className="flex justify-center items-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading timetable...
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">No Classes Scheduled</div>
            <div className="text-xs text-muted-foreground mt-1 max-w-xs">
              Your weekly timetable is currently empty. Assigned classes will appear here once the admin publishes the schedule.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {days.map((day) => {
              const daySlots = schedule.filter((s: any) => s.dayOfWeek === day);
              return (
                <div key={day} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    {day}
                  </div>
                  <div className="p-3 space-y-3 min-h-[200px]">
                    {daySlots.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground text-center py-4 italic">No classes</div>
                    ) : (
                      daySlots.map((slot: any, idx: number) => (
                        <div key={idx} className="rounded-lg border border-border bg-card p-3 shadow-sm hover:border-accent transition-colors">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent mb-1.5">
                            <Clock className="h-3 w-3" /> {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {slot.subjectId?.name || "Subject"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Class {slot.classId?.name || "N/A"}{slot.sectionId?.name ? ` - ${slot.sectionId.name}` : ""}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 bg-muted rounded px-2 py-1">
                            <MapPin className="h-3 w-3" /> {slot.room || "TBA"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
