import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, MessageSquare, Mail, Smartphone, Check } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/student/notifications")({ component: Page });

interface Notification {
  _id: string;
  title: string;
  body: string;
  time: string;
  channel: string;
  isRead: boolean;
  priority: string;
}

function Page() {
  const [filter, setFilter] = useState<"all" | "app" | "sms" | "email">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  // Fetch notifications
  useEffect(() => {
    fetch("/api/v1/notifications")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        const formatted = list.map((n: any) => ({
          _id: n._id,
          title: n.title,
          body: n.message,
          time: new Date(n.createdAt).toLocaleString(),
          channel: n.channels?.[0] || "app",
          isRead: n.isRead,
          priority: n.priority?.toLowerCase() || "normal",
        }));
        setNotifications(formatted);
      })
      .catch((err) => console.error("Failed to fetch notifications", err));
  }, []);

  // Update readSet when notifications load
  useEffect(() => {
    setReadSet(new Set(notifications.filter((n) => n.isRead).map((n) => n._id)));
  }, [notifications]);

  const filtered = notifications.filter((n) => filter === "all" || n.channel === filter);
  const channelIcon = { app: Smartphone, sms: MessageSquare, email: Mail };

  const markRead = (id: string) => {
    setReadSet((prev) => new Set([...prev, id]));
    toast.success("Marked as read");
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${notifications.filter((n) => !readSet.has(n._id)).length} unread`}
      />
      <div className="flex gap-2 mb-4">
        {(["all", "app", "sms", "email"] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setFilter(ch)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === ch ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
          >
            {ch === "all" ? "All" : ch.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="max-w-2xl space-y-3">
        {filtered.map((n) => {
          const Icon = channelIcon[n.channel as keyof typeof channelIcon] || Bell;
          const isRead = readSet.has(n._id);
          return (
            <div
              key={n._id}
              className={`rounded-xl border p-4 shadow-sm transition-all ${!isRead ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${n.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${!isRead ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.title}
                    </span>
                    {!isRead && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {n.time} · via {n.channel}
                  </div>
                </div>
                {!isRead && (
                  <button
                    onClick={() => markRead(n._id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border hover:bg-muted"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
