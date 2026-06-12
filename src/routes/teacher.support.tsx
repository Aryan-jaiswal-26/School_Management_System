import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { LifeBuoy, Plus, MessageSquare, AlertCircle, CheckCircle, Clock } from "lucide-react";

const genId = () => Math.random().toString(36).substr(2, 9);

export const Route = createFileRoute("/teacher/support")({
  head: () => ({ meta: [{ title: "Tickets & Support · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  
  const [supportTicketsStore, setSupportTicketsStore] = useState<any[]>([]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IT Support");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");

  const teacherName = user?.name || "Teacher";

  // Filter tickets by current user
  const tickets = supportTicketsStore.filter(
    (t) => t.submittedBy === teacherName || t.submittedBy === "Teacher",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newTicket = {
      id: genId(),
      title,
      description,
      category,
      submittedBy: teacherName,
      status: "open" as const,
      priority,
      createdAt: new Date().toISOString().split("T")[0],
      responses: [],
    };

    setSupportTicketsStore((prev) => [newTicket, ...prev]);
    toast.success("Support ticket submitted!", {
      description: "Our admin team has been notified.",
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setShowAddForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.65_0.15_155)]/10 px-2 py-0.5 text-xs font-medium text-[oklch(0.45_0.15_155)]">
            <CheckCircle className="h-3 w-3" /> Resolved
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
            <Clock className="h-3 w-3" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.75_0.15_75)]/10 px-2 py-0.5 text-xs font-medium text-[oklch(0.50_0.15_75)]">
            <AlertCircle className="h-3 w-3" /> Open
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="text-xs font-medium text-destructive">High Priority</span>;
      case "low":
        return <span className="text-xs font-medium text-muted-foreground">Low Priority</span>;
      default:
        return (
          <span className="text-xs font-medium text-[oklch(0.50_0.15_75)]">Medium Priority</span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets & Support"
        subtitle="Raise service tickets for IT support, classroom maintenance, or administrative help."
        actions={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Submit form or tickets statistics */}
        <div className="lg:col-span-1 space-y-4">
          {showAddForm ? (
            <Panel title="Open Support Ticket">
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Smartboard not working in Room 201"
                    required
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    >
                      <option>IT Support</option>
                      <option>Classroom Maintenance</option>
                      <option>Supplies Request</option>
                      <option>HR & Salaries</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    required
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </Panel>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-sm">Need Urgent Help?</h4>
                  <p className="text-xs text-muted-foreground">
                    Submit a ticket for priority attention.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tickets Submitted</span>
                <span className="font-bold text-foreground">{tickets.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resolved Tickets</span>
                <span className="font-bold text-[oklch(0.45_0.15_155)]">
                  {tickets.filter((t) => t.status === "resolved").length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: List of tickets */}
        <div className="lg:col-span-2 space-y-4">
          <Panel title="My Support Tickets">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">No support tickets found</div>
                <div className="text-xs text-muted-foreground mt-1">
                  If you have any issues, raise your first ticket.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-border p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{ticket.title}</h4>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{ticket.category}</span>
                          <span>•</span>
                          <span>{ticket.createdAt}</span>
                          <span>•</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed bg-background p-2.5 rounded-lg border border-border/60">
                      {ticket.description}
                    </p>

                    {/* Responses section */}
                    {ticket.responses.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Replies
                        </div>
                        {ticket.responses.map((resp, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-accent/5 p-3 border border-accent/10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-accent">
                                {resp.author}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{resp.date}</span>
                            </div>
                            <p className="mt-1 text-xs text-foreground">{resp.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
