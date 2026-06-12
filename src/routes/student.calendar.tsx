import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarDays, GraduationCap, PartyPopper, Sun, Clock } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/student/calendar")({ component: Page });

const typeConfig = {
  exam: { icon: GraduationCap, color: "bg-destructive/10 text-destructive" },
  event: { icon: PartyPopper, color: "bg-accent/10 text-accent" },
  holiday: { icon: Sun, color: "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]" },
  deadline: { icon: Clock, color: "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" },
};

function Page() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    apiClient<any[]>('/events')
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        const formatted = list.map((e: any) => ({
          id: e._id || e.id,
          title: e.title,
          date: new Date(e.date).toISOString().split("T")[0],
          type: (e.type?.toLowerCase() || "event"),
          description: e.description || e.tickets || "School event",
        }));
        setEvents(formatted);
      })
      .catch(console.error);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthYearLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isTodayDate = (day: number) => 
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div>
      <PageHeader
        title="Calendar & Events"
        subtitle="Upcoming exams, events, and important dates"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel 
            title={monthYearLabel}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Prev
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Next
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = isTodayDate(day);
                return (
                  <div
                    key={day}
                    className={`rounded-lg p-1.5 min-h-[60px] text-xs border transition-all ${isToday ? "border-accent bg-accent/5" : dayEvents.length > 0 ? "border-border bg-card" : "border-transparent"}`}
                  >
                    <div className={`font-medium mb-0.5 ${isToday ? "text-accent" : ""}`}>
                      {day}
                    </div>
                    {dayEvents.slice(0, 2).map((e) => {
                      const cfg = typeConfig[e.type as keyof typeof typeConfig] || typeConfig.event;
                      return (
                        <div
                          key={e.id}
                          className={`rounded px-1 py-0.5 text-[9px] truncate mt-0.5 ${cfg.color}`}
                        >
                          {e.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
        <Panel title="Upcoming">
          <div className="space-y-3">
            {events
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => {
                const cfg = typeConfig[e.type as keyof typeof typeConfig] || typeConfig.event;
                const Icon = cfg.icon;
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cfg.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.date} · {e.description}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
