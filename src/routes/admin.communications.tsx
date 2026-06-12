import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Mail, Bell, Plus, X, Send, LifeBuoy, Megaphone, FileText, Download, Loader2 } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient, BASE_URL } from "@/lib/api-client";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/communications")({
  head: () => ({ meta: [{ title: "Communications · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"notices" | "broadcast" | "tickets" | "newsletters">("notices");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddNewsletter, setShowAddNewsletter] = useState(false);
  const [broadcastType, setBroadcastType] = useState<"sms" | "email">("sms");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const [annRes, newsRes] = await Promise.allSettled([
        apiClient<any>("/notifications/announcements"),
        apiClient<any>("/newsletters")
      ]);
      if (annRes.status === "fulfilled") setAnnouncements(annRes.value?.data || []);
      if (newsRes.status === "fulfilled") setNewsletters(newsRes.value?.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div>
      <PageHeader title="Communications" subtitle="Notices, broadcasts, and IT support" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Announcements"
          value={String(announcements.length)}
          icon={Megaphone}
          tone="info"
        />
        <StatCard
          label="Open Tickets"
          value="0"
          icon={LifeBuoy}
          tone="warning"
        />
        <StatCard label="SMS Sent Today" value="142" icon={MessageSquare} tone="success" />
        <StatCard label="Emails Queued" value="28" icon={Mail} />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["notices", "Notice Board"],
            ["broadcast", "Broadcast"],
            ["newsletters", "Newsletters"],
            ["tickets", "IT Help Desk"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "notices" && (
        <Panel
          title="Announcements"
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Post Notice
            </button>
          }
        >
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border p-4 ${a.priority === "urgent" ? "border-destructive/50 bg-destructive/5" : a.priority === "important" ? "border-accent/30 bg-accent/5" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{a.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${a.priority === "urgent" ? "bg-destructive/10 text-destructive" : a.priority === "important" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {a.author} · {a.date} · {a.target}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await apiClient(`/notifications/announcements/${a.id}`, { method: "DELETE" });
                        toast.success("Notice removed");
                        fetchAnnouncements();
                      } catch (err) {
                        toast.error("Failed to remove notice");
                      }
                    }}
                    className="text-xs text-destructive hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {announcements.length === 0 && (
            <EmptyState
              icon={Megaphone}
              title="No announcements"
              description="Post a notice to get started."
            />
          )}
        </Panel>
      )}

      {tab === "broadcast" && (
        <Panel title="Send Broadcast">
          <div className="max-w-lg space-y-4">
            <div className="flex gap-2">
              {(["sms", "email"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBroadcastType(t)}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${broadcastType === t ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-muted"}`}
                >
                  {t === "sms" ? "📱 SMS" : "📧 Email"}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target Audience</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Message</label>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="Type your message…"
              />
            </div>
            <button
              disabled={sendingBroadcast}
              onClick={async () => {
                if (!broadcastMsg.trim()) return;
                setSendingBroadcast(true);
                try {
                  // Connect to SMS / Broadcast API
                  await apiClient("/notifications/broadcast", {
                    method: "POST",
                    data: {
                      type: broadcastType,
                      target: broadcastTarget,
                      message: broadcastMsg
                    }
                  });
                  toast.success(`${broadcastType.toUpperCase()} sent!`, {
                    description: `Message broadcast to ${broadcastTarget}.`,
                  });
                  setBroadcastMsg("");
                } catch (e) {
                  toast.error(`Failed to send ${broadcastType.toUpperCase()}`);
                } finally {
                  setSendingBroadcast(false);
                }
              }}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send {broadcastType.toUpperCase()}
            </button>
          </div>
        </Panel>
      )}

      {tab === "tickets" && (
        <Panel title="IT Help Desk">
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets"
            description="Tickets from parents and staff will appear here."
          />
        </Panel>
      )}

      {tab === "newsletters" && (
        <Panel
          title="School Magazine & Newsletters"
          action={
            <button
              onClick={() => setShowAddNewsletter(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Publish Issue
            </button>
          }
        >
          <div className="space-y-3">
            {newsletters.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No newsletters"
                description="Publish your first school magazine or newsletter."
              />
            )}
            {newsletters.map((n) => (
              <div key={n._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Vol: {n.volume} · Issue: {n.issue} · Published: {new Date(n.publishDate || n.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => window.open(`${BASE_URL}/v1/newsletters/${n._id}/pdf`, "_blank")}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-500/20"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Post Notice</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await apiClient("/notifications/announcements", {
                    method: "POST",
                    data: {
                      title: fd.get("title") as string,
                      content: fd.get("content") as string,
                      target: fd.get("target") as string,
                      priority: fd.get("priority") as string,
                    }
                  });
                  toast.success("Notice posted");
                  setShowAdd(false);
                  fetchAnnouncements();
                } catch (err) {
                  toast.error("Failed to post notice");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  name="title"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Content</label>
                <textarea
                  name="content"
                  required
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none resize-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Target</label>
                  <select
                    name="target"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Priority</label>
                  <select
                    name="priority"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Post Notice
              </button>
            </form>
          </div>
        </div>
      )}
      {showAddNewsletter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAddNewsletter(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Publish Newsletter</h2>
              <button
                onClick={() => setShowAddNewsletter(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await apiClient("/newsletters", {
                    method: "POST",
                    data: {
                      title: fd.get("title") as string,
                      content: fd.get("content") as string,
                      volume: fd.get("volume") as string,
                      issue: fd.get("issue") as string,
                      status: "PUBLISHED",
                    }
                  });
                  toast.success("Newsletter published!");
                  setShowAddNewsletter(false);
                  fetchAnnouncements();
                } catch (err) {
                  toast.error("Failed to publish newsletter");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Spring 2026 Monthly Digest"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Volume</label>
                  <input
                    name="volume"
                    required
                    placeholder="e.g. Vol 5"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Issue</label>
                  <input
                    name="issue"
                    required
                    placeholder="e.g. Issue 2"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Content / Markdown</label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Write the newsletter content here..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none resize-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Publish & Generate PDF
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
