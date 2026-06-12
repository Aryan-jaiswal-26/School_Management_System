import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Megaphone, Calendar } from "lucide-react";

export const Route = createFileRoute("/student/feed")({ component: Page });

function Page() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    apiClient<any>("/notifications/announcements")
      .then((res) => {
        const all = res?.data || [];
        setAnnouncements(all.filter((a: any) => a.target === "all" || a.target === "students"));
      })
      .catch(() => {});
  }, []);

  const visible = announcements;

  return (
    <div>
      <PageHeader title="Feed" subtitle="School announcements and updates" />
      <div className="max-w-2xl space-y-4">
        {visible.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${a.priority === "urgent" ? "border-destructive/40 bg-destructive/5" : a.priority === "important" ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${a.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}
              >
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{a.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${a.priority === "urgent" ? "bg-destructive/10 text-destructive" : a.priority === "important" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
                  >
                    {a.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{a.content}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {a.date} · {a.author}
                </div>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="School updates and notices will appear here when published."
          />
        )}
      </div>
    </div>
  );
}
