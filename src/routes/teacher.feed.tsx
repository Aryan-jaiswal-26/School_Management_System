import { useTeacherData } from '@/hooks/useTeacherData';
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from '@/lib/auth-context';

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Megaphone, Calendar, Send, Award, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/teacher/feed")({
  head: () => ({ meta: [{ title: "Campus Feed · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [quickPost, setQuickPost] = useState("");

  // Fetch announcements only when user is authenticated
  const fetchFn = useCallback(() => {
    return user?.id ? apiClient<any>("/notifications/announcements") : Promise.resolve([] as any[]);
  }, [user?.id]);
  const { data: announcements = [], loading, error, retry } = useTeacherData(fetchFn);
  const visible = announcements;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If not mounted (SSR), show a minimal loading placeholder.
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading feed...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading feed...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <span className="text-destructive">Failed to load feed: {error.message}</span>
        <button onClick={retry} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Retry
        </button>
      </div>
    );
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPost.trim()) return;
    try {
      await apiClient("/notifications/announcements", {
        method: "POST",
        data: { title: "Teacher Quick Update", content: quickPost, target: "all", priority: "normal" },
      });
      toast.success("Post shared to public feed!");
      setQuickPost("");
      retry();
    } catch {
      toast.error("Failed to post");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Feed" subtitle="Browse campus-wide announcements and faculty bulletins." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Post Box */}
          <Panel title="Share something with the School">
            <form onSubmit={handleQuickSubmit} className="mt-2 space-y-3">
              <textarea
                value={quickPost}
                onChange={(e) => setQuickPost(e.target.value)}
                placeholder="What's happening in your classroom today? Share an update, event, or reminder..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!quickPost.trim()}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Post Update
                </button>
              </div>
            </form>
          </Panel>
          {/* Feed Posts */}
          <div className="space-y-4">
            {visible.map((a) => {
              const priority = a.priority ?? "normal";
              const title = a.title ?? "Untitled";
              const content = a.content ?? "";
              const author = a.author ?? "Unknown";
              const date = a.date ?? "";
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                    priority === "urgent"
                      ? "border-destructive/40 bg-destructive/5"
                      : priority === "important"
                        ? "border-accent/30 bg-accent/5"
                        : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                        priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                      }`}
                    >
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base text-foreground">{title}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            priority === "urgent"
                              ? "bg-destructive/10 text-destructive"
                              : priority === "important"
                                ? "bg-accent/10 text-accent"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {priority}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{content}</p>
                      <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{date}</span>
                        <span>By {author}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && (
              <Panel title="Feed Empty">
                <p className="text-sm text-muted-foreground">No announcements found at this time.</p>
              </Panel>
            )}
          </div>
        </div>
        {/* Right Info Widgets Column */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-sm text-muted-foreground">May 24, 2026 • Main Hall</p>
          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 border border-border">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-foreground">Annual Sports Day</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">June 02, 2026 • Campus Grounds</p>
            </div>
          </div>
          <Panel title="Faculty Announcements">
            <div className="space-y-3 mt-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-accent" />Staff Meeting</span>
                <span className="text-[10px] text-muted-foreground">Today</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">A brief staff meeting will be held today at 4:00 PM in the Conference Room. Attendance is mandatory.</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
