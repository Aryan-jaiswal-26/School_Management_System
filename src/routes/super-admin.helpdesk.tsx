import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  useSuperAdmin,
  type SupportTicket,
  type Announcement,
} from "@/components/super-admin/super-admin-context";
import {
  Megaphone,
  Inbox,
  UserCheck,
  CheckCircle,
  Clock,
  Send,
  AlertOctagon,
  FileText,
  Mail,
  Smartphone,
  Bell,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Users,
  Calendar,
  Contact,
  CreditCard,
  BookOpen,
  User,
  Plus,
  Shield,
  Trash,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Panel, PageHeader, EmptyState } from "@/components/module-shell";
import { StatusBadge, DataTable, TableHead, TableRow, ActionButton } from "@/components/page-ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── ROUTE DEFINITION ──
export const Route = createFileRoute("/super-admin/helpdesk")({
  component: SuperAdminHelpdesk,
});

const SYSTEM_ASSIGNEES = ["Sarah Jenkins", "Alex Rivera", "David Miller", "Unassigned"];

function getSlaCountdown(createdAtStr: string, limitHours: number) {
  const created = new Date(createdAtStr).getTime();
  const limitMs = limitHours * 3600 * 1000;
  const deadline = created + limitMs;
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return { label: "SLA Breached!", breached: true, warning: false };
  }

  const diffHours = diffMs / (3600 * 1000);
  if (diffHours < 2) {
    const mins = Math.round((diffMs % (3600 * 1000)) / (60 * 1000));
    return { label: `${Math.floor(diffHours)}h ${mins}m left`, breached: false, warning: true };
  }

  return { label: `${Math.round(diffHours)}h remaining`, breached: false, warning: false };
}

function SuperAdminHelpdesk() {
  const {
    schools,
    supportTickets,
    announcements,
    postAnnouncement,
    addTicketReply,
    updateTicketAssignee,
    updateTicketStatus,
  } = useSuperAdmin();

  // Sub-tabs State: 'helpdesk' | 'broadcast' | 'team' | 'templates'
  const [activeSubTab, setActiveSubTab] = useState<"helpdesk" | "broadcast" | "team" | "templates">(
    "helpdesk",
  );

  // SLA Helpdesk states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketCategory, setTicketCategory] = useState("ALL");
  const [ticketPriority, setTicketPriority] = useState("ALL");
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [liveChatInput, setLiveChatInput] = useState("");
  const [liveChatMessages, setLiveChatMessages] = useState([
    {
      id: "1",
      author: "Oakwood Admin",
      text: "Hello! We are having issues with Stripe payment processing today.",
      time: "11:20 AM",
      self: false,
    },
    {
      id: "2",
      author: "SaaS Bot",
      text: "Connecting you to an agent. Assigned agent: Sarah Jenkins.",
      time: "11:21 AM",
      self: false,
    },
  ]);

  // Broadcast states
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceChannels, setAnnounceChannels] = useState<Announcement["channels"]>(["In-App"]);
  const [announceTargetType, setAnnounceTargetType] = useState<Announcement["targetType"]>("All");
  const [announceTargetSchools, setAnnounceTargetSchools] = useState<string[]>([]);
  const [announceScheduleDate, setAnnounceScheduleDate] = useState("");

  // Internal team states
  const [teamMembers, setTeamMembers] = useState([
    {
      id: "team-1",
      name: "Sarah Jenkins",
      email: "sarah.j@campus.os",
      role: "Support Staff",
      access: "Tickets & Live Chat Only",
      logs: "Resolved ticket #8b7c",
    },
    {
      id: "team-2",
      name: "Alex Rivera",
      email: "alex.r@campus.os",
      role: "Billing Specialist",
      access: "Invoices, Plans & Refunds",
      logs: "Processed refund for inv-c3b2",
    },
    {
      id: "team-3",
      name: "David Miller",
      email: "d.miller@campus.os",
      role: "System Administrator",
      access: "Full Root Level Controls",
      logs: "Enforced global 2FA auth policy",
    },
  ]);
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    email: "",
    role: "Support Staff",
  });

  // Master templates states
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<
    "holiday" | "marksheet" | "certificates" | "idcard"
  >("holiday");
  const [holidayTemplate, setHolidayTemplate] = useState([
    { event: "Summer Vacation", start: "2026-06-01", end: "2026-06-30", type: "Global Holiday" },
    { event: "Winter Break", start: "2026-12-24", end: "2026-12-31", type: "Global Holiday" },
  ]);

  const activeTicket = supportTickets.find((t) => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (supportTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(supportTickets[0]!.id);
    }
  }, [supportTickets, selectedTicketId]);

  const toggleSchoolTarget = (schoolId: string) => {
    setAnnounceTargetSchools((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId],
    );
  };

  const toggleChannel = (ch: Announcement["channels"][number]) => {
    setAnnounceChannels((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch],
    );
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceBody) return;
    postAnnouncement({
      title: announceTitle,
      body: announceBody,
      channels: announceChannels,
      targetType: announceTargetType,
      targetSchools: announceTargetSchools,
    });
    if (announceScheduleDate) {
      toast.success("Broadcast Scheduled Successfully", {
        description: `Announcement scheduled for release on: ${announceScheduleDate}.`,
      });
    }
    setAnnounceTitle("");
    setAnnounceBody("");
    setAnnounceChannels(["In-App"]);
    setAnnounceTargetType("All");
    setAnnounceTargetSchools([]);
    setAnnounceScheduleDate("");
  };

  const handleTriggerEmergencyAlert = () => {
    toast.warning("Emergency Alert Broadcasted Platform-wide!", {
      description:
        "Critical notification SMS, email and push alert dispatches triggered immediately.",
    });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicketId) return;
    addTicketReply(selectedTicketId, replyInput);
    setReplyInput("");
  };

  // Live Chat submit
  const handleLiveChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim()) return;
    const newMsg = {
      id: Math.random().toString(),
      author: "Super Admin",
      text: liveChatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      self: true,
    };
    setLiveChatMessages([...liveChatMessages, newMsg]);
    setLiveChatInput("");

    // Bot reply trigger
    setTimeout(() => {
      setLiveChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          author: "Oakwood Admin",
          text: "Thank you! I will verify the gateway settings now.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          self: false,
        },
      ]);
    }, 1200);
  };

  // Add Internal Staff
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMember.name || !newTeamMember.email) return;
    const accessLevels = {
      "Support Staff": "Tickets & Live Chat Only",
      "Billing Specialist": "Invoices, Plans & Refunds",
      "System Administrator": "Full Root Level Controls",
    };
    const freshMember = {
      id: `team-${Math.random().toString(36).substr(2, 9)}`,
      name: newTeamMember.name,
      email: newTeamMember.email,
      role: newTeamMember.role,
      access: accessLevels[newTeamMember.role as keyof typeof accessLevels] || "None",
      logs: "Enrolled in team roster",
    };
    setTeamMembers([...teamMembers, freshMember]);
    setNewTeamMember({ name: "", email: "", role: "Support Staff" });
    toast.success("Super Admin Staff Enrolled", {
      description: `${freshMember.name} successfully registered in internal control roster.`,
    });
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
    toast.error("Internal staff member removed from roster.");
  };

  const filteredTickets = supportTickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchesCategory = ticketCategory === "ALL" || t.category === ticketCategory;
    const matchesPriority = ticketPriority === "ALL" || t.priority === ticketPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Broadcasts & SLA Support Ticketing"
        subtitle="Schedule platform alerts, track notification logs, manage master templates, and address support tickets."
      />

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveSubTab("helpdesk")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "helpdesk"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Inbox className="h-4 w-4" /> SLA Helpdesk
        </button>
        <button
          onClick={() => setActiveSubTab("broadcast")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "broadcast"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Megaphone className="h-4 w-4" /> Broadcast System
        </button>
        <button
          onClick={() => setActiveSubTab("team")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "team"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="h-4 w-4" /> Internal Team Roles
        </button>
        <button
          onClick={() => setActiveSubTab("templates")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "templates"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="h-4 w-4" /> Master Templates
        </button>
      </div>

      {/* ── SUB-TAB RENDERERS ── */}

      {/* TAB 1: SLA HELPDESK & LIVE CHAT */}
      {activeSubTab === "helpdesk" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-card border px-4 py-3 rounded-xl">
            <h4 className="text-xs font-bold text-foreground">SLA Customer Relations Desk</h4>
            <button
              onClick={() => setShowLiveChat(!showLiveChat)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 animate-pulse"
            >
              <Send className="h-3 w-3" />{" "}
              {showLiveChat ? "Open SLA Tickets" : "Open Live Admin Chat"}
            </button>
          </div>

          {!showLiveChat ? (
            /* SLA TICKETS LIST SCREEN */
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1 space-y-4">
                <Panel title="Helpdesk Support Cases">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Query ticket feed..."
                        className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="h-8 rounded-lg border border-border bg-card px-2 text-[9px] font-bold cursor-pointer outline-none"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Billing">Billing</option>
                        <option value="Technical">Technical</option>
                        <option value="Access Control">Access Control</option>
                        <option value="General">General</option>
                      </select>

                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className="h-8 rounded-lg border border-border bg-card px-2 text-[9px] font-bold cursor-pointer outline-none"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 pt-1">
                      {filteredTickets.map((t) => {
                        const isSelected = selectedTicketId === t.id;
                        const { label, breached, warning } = getSlaCountdown(
                          t.createdAt,
                          t.slaLimitHours,
                        );
                        const priorityColors = {
                          Critical: "bg-rose-500/10 text-rose-500 border-rose-500/25",
                          High: "bg-amber-500/10 text-amber-500 border-amber-500/25",
                          Medium: "bg-indigo-500/10 text-indigo-500 border-indigo-500/25",
                          Low: "bg-muted text-muted-foreground border-border",
                        };

                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-xl border transition-all cursor-pointer",
                              isSelected
                                ? "border-indigo-600 bg-indigo-500/5 shadow-sm"
                                : "border-border bg-card hover:bg-muted/40",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase",
                                  priorityColors[t.priority],
                                )}
                              >
                                {t.priority}
                              </span>
                              <span
                                className={cn(
                                  "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded",
                                  breached
                                    ? "bg-rose-600/10 text-rose-500 border-rose-500/20"
                                    : warning
                                      ? "bg-amber-500/10 text-amber-500 border"
                                      : "bg-muted",
                                )}
                              >
                                <Clock className="h-3 w-3" /> {label}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-foreground mt-2 line-clamp-1">
                              {t.title}
                            </h4>
                            <div className="text-[9px] text-muted-foreground mt-1 flex justify-between">
                              <span>{t.schoolName}</span>
                              <span>SLA: {t.slaLimitHours}h</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Panel>
              </div>

              {/* TICKET DETAILS TIMELINE */}
              <div className="md:col-span-2">
                {activeTicket ? (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col h-[520px] justify-between">
                    <div className="pb-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center justify-between shrink-0">
                      <div>
                        <h3 className="font-bold text-xs text-foreground leading-snug">
                          {activeTicket.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            Category: {activeTicket.category}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            ID: #{activeTicket.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-1 border h-8">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          <select
                            value={activeTicket.assignee}
                            onChange={(e) => updateTicketAssignee(activeTicket.id, e.target.value)}
                            className="bg-transparent text-[9px] font-bold outline-none cursor-pointer pr-1"
                          >
                            {SYSTEM_ASSIGNEES.map((user) => (
                              <option key={user} value={user}>
                                {user}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-1 border h-8">
                          <select
                            value={activeTicket.status}
                            onChange={(e) =>
                              updateTicketStatus(activeTicket.id, e.target.value as any)
                            }
                            className="bg-transparent text-[9px] font-bold outline-none cursor-pointer pr-1"
                          >
                            <option value="Open">Open</option>
                            <option value="In-Progress">In-Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
                      <div className="bg-muted/30 p-3 rounded-xl border space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                          <span>Request Details Block</span>
                          <span>By {activeTicket.schoolName}</span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed font-semibold pt-1">
                          {activeTicket.description}
                        </p>
                      </div>

                      {activeTicket.replies.map((r) => {
                        const isBot = r.role === "System Bot";
                        const isSuper = r.role === "Super Admin";
                        return (
                          <div
                            key={r.id}
                            className={cn(
                              "flex flex-col gap-1 max-w-[85%] text-xs",
                              isSuper ? "ml-auto items-end" : "mr-auto items-start",
                            )}
                          >
                            <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                              <span>{r.author}</span>
                              <span>·</span>
                              <span>
                                {new Date(r.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "p-3 rounded-2xl leading-relaxed border shadow-sm",
                                isBot
                                  ? "bg-slate-900 text-slate-300 font-mono text-[9px]"
                                  : isSuper
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-card text-foreground rounded-tl-none",
                              )}
                            >
                              {r.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={handleReplySubmit}
                      className="pt-3 border-t shrink-0 flex gap-2"
                    >
                      <input
                        required
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Compose support dispatch..."
                        className="h-10 flex-1 rounded-xl border bg-card px-4 text-xs outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      >
                        <Send className="h-4.5 w-4.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <EmptyState
                    icon={Inbox}
                    title="No support tickets selected"
                    description="Choose a case from the active feed."
                  />
                )}
              </div>
            </div>
          ) : (
            /* LIVE CHAT SIMULATOR */
            <Panel title="Real-Time Admin Live Chat Messenger">
              <div className="flex flex-col h-[480px] justify-between text-xs max-w-2xl mx-auto border rounded-2xl bg-card shadow">
                {/* Chat header */}
                <div className="p-3 border-b flex justify-between items-center bg-muted/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <strong className="text-foreground font-bold">
                      Oakwood International (Admin principal@oakwood.edu)
                    </strong>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Real-Time Messaging Session
                  </span>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                  {liveChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[80%] gap-1",
                        msg.self ? "ml-auto items-end" : "mr-auto items-start",
                      )}
                    >
                      <span className="text-[8px] text-muted-foreground">
                        {msg.author} · {msg.time}
                      </span>
                      <div
                        className={cn(
                          "p-2.5 rounded-xl border",
                          msg.self
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-card text-foreground rounded-tl-none",
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleLiveChatSubmit}
                  className="p-3 border-t bg-card shrink-0 flex gap-2 rounded-b-2xl"
                >
                  <input
                    required
                    type="text"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Type a real-time message payload to school administrator..."
                    className="h-10 flex-1 rounded-xl border px-3 text-xs outline-none"
                  />
                  <button
                    type="submit"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* TAB 2: BROADCAST SYSTEM */}
      {activeSubTab === "broadcast" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* EMERGENCY TRIGGER BUTTON */}
          <div className="flex gap-3 items-center p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-rose-500 shrink-0 animate-bounce" />
              <div>
                <strong className="text-xs uppercase tracking-wider block font-bold text-foreground">
                  Critical Emergency Broadcast Override
                </strong>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Broadcast alert message payload instantly across all communication channels of all
                  registered schools.
                </span>
              </div>
            </div>
            <button
              onClick={handleTriggerEmergencyAlert}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer shadow-md"
            >
              Trigger Global Emergency Alert
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* BROADCAST COMPOSE */}
            <Panel title="Platform Broadcast Composer" className="lg:col-span-2">
              <form onSubmit={handleComposeSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Announcement Title Header
                  </label>
                  <input
                    required
                    type="text"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="e.g. Schedule Database Maintenance Window..."
                    className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Message Body payload
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={announceBody}
                    onChange={(e) => setAnnounceBody(e.target.value)}
                    placeholder="Write detailed announcements payload dispatch..."
                    className="w-full rounded-lg border bg-card p-3 text-xs outline-none focus:border-indigo-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 pt-1">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Communication Channels
                    </label>
                    <div className="flex flex-wrap gap-2 border bg-muted/10 p-2 rounded-lg">
                      {(["In-App", "Push", "Email", "SMS"] as const).map((ch) => {
                        const active = announceChannels.includes(ch);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChannel(ch)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md border cursor-pointer transition-all",
                              active
                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                : "border-border bg-card text-muted-foreground",
                            )}
                          >
                            <Bell className="h-3 w-3" /> {ch}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Schedule for Later (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={announceScheduleDate}
                      onChange={(e) => setAnnounceScheduleDate(e.target.value)}
                      className="h-9 w-full rounded-lg border bg-card px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Target Criteria Scope
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={announceTargetType}
                        onChange={(e) => setAnnounceTargetType(e.target.value as any)}
                        className="h-10 rounded-lg border bg-card px-3 text-xs outline-none cursor-pointer sm:w-44 shrink-0"
                      >
                        <option value="All">All Registered Schools</option>
                        <option value="Targeted">Targeted Schools List</option>
                      </select>

                      {announceTargetType === "Targeted" && (
                        <div className="flex-1 max-h-[80px] overflow-y-auto border rounded-lg p-2 bg-card/60 grid grid-cols-2 gap-1.5">
                          {schools.map((s) => {
                            const checked = announceTargetSchools.includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className="flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSchoolTarget(s.id)}
                                  className="rounded"
                                />
                                <span className="truncate">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <ActionButton
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold uppercase tracking-wide"
                  >
                    <Megaphone className="h-4 w-4" /> Dispatch System Announcement
                  </ActionButton>
                </div>
              </form>
            </Panel>

            {/* BROADCAST DISPATCH HISTORY */}
            <Panel title="Announcement Dispatch History">
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {announcements.map((a) => {
                  const readRatio =
                    a.totalRecipients > 0 ? (a.readCount / a.totalRecipients) * 100 : 80;
                  return (
                    <div key={a.id} className="p-3 border bg-card rounded-lg space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-foreground truncate">{a.title}</h4>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                        {a.body}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {a.channels.map((ch) => (
                          <span
                            key={ch}
                            className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase tracking-wide"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-1 pt-1.5 border-t border-border/40 text-[9px] font-semibold">
                        <div className="flex justify-between">
                          <span>Read receipts logs:</span>
                          <strong className="text-foreground">
                            {readRatio.toFixed(0)}% ({a.readCount} / {a.totalRecipients})
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                            style={{ width: `${readRatio}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* TAB 3: INTERNAL TEAM ROLES */}
      {activeSubTab === "team" && (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-200">
          {/* STAFF LIST */}
          <div className="md:col-span-2 space-y-6">
            <Panel title="SaaS Super Admin Control Staff list">
              <div className="overflow-x-auto rounded-lg border border-border">
                <DataTable>
                  <TableHead>
                    <th className="px-4 py-3 text-left">Staff Member</th>
                    <th className="px-4 py-3 text-left">Internal Sub-Role</th>
                    <th className="px-4 py-3 text-left">Granular View Access Scope</th>
                    <th className="px-4 py-3 text-left">Last Audit Action</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </TableHead>
                  <tbody>
                    {teamMembers.map((m) => (
                      <TableRow key={m.id}>
                        <td className="px-4 py-3.5">
                          <div>
                            <div className="font-semibold text-foreground text-xs leading-none">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {m.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-500 uppercase tracking-wide">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{m.access}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                          {m.logs}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleRemoveTeamMember(m.id)}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                            title="Remove Staff privileges"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </TableRow>
                    ))}
                  </tbody>
                </DataTable>
              </div>
            </Panel>
          </div>

          {/* ADD STAFF MEMBER */}
          <Panel title="Enroll Staff Member">
            <form onSubmit={handleAddTeamMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={newTeamMember.name}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                  placeholder="e.g. Johnathan Vance"
                  className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Official Email Address
                </label>
                <input
                  required
                  type="email"
                  value={newTeamMember.email}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                  placeholder="j.vance@campus.os"
                  className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Internal Sub-Role
                </label>
                <select
                  value={newTeamMember.role}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                  className="h-10 w-full rounded-lg border bg-card px-3 text-xs cursor-pointer outline-none"
                >
                  <option value="Support Staff">Support Staff (Tickets & Chat)</option>
                  <option value="Billing Specialist">Billing Specialist (Invoices & Plans)</option>
                  <option value="System Administrator">System Administrator (Full access)</option>
                </select>
              </div>

              <ActionButton
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wide"
              >
                Deploy Staff Permissions
              </ActionButton>
            </form>
          </Panel>
        </div>
      )}

      {/* TAB 4: MASTER DATA TEMPLATES */}
      {activeSubTab === "templates" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex border-b border-border/80">
            {[
              { id: "holiday", label: "Holiday Template", icon: Calendar },
              { id: "marksheet", label: "Marksheet templates", icon: FileText },
              { id: "certificates", label: "Certificates bonafide", icon: ShieldCheck },
              { id: "idcard", label: "ID Card Designer", icon: Contact },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTemplateTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
                  selectedTemplateTab === tab.id
                    ? "border-indigo-600 text-indigo-500"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          {selectedTemplateTab === "holiday" && (
            <div className="grid gap-6 md:grid-cols-3">
              <Panel title="Global Holiday Calendar Template" className="md:col-span-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      Manage templates shared across schools calendars.
                    </span>
                    <button
                      onClick={() => toast.success("New holiday event template added.")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-xl cursor-pointer"
                    >
                      + Add Holiday Event
                    </button>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <DataTable>
                      <TableHead>
                        <th className="px-4 py-3 text-left">Holiday Event</th>
                        <th className="px-4 py-3 text-left">Start Date</th>
                        <th className="px-4 py-3 text-left">End Date</th>
                        <th className="px-4 py-3 text-left">Type Classification</th>
                      </TableHead>
                      <tbody>
                        {holidayTemplate.map((h, idx) => (
                          <TableRow key={idx}>
                            <td className="px-4 py-3 text-xs font-bold text-foreground">
                              {h.event}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{h.start}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{h.end}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-semibold">
                              {h.type}
                            </td>
                          </TableRow>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {selectedTemplateTab === "marksheet" && (
            <Panel title="Global Marksheet & Report Card template designer" className="max-w-2xl">
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground leading-normal">
                  Customize the layout structure for term marksheets generated dynamically by single
                  school teachers.
                </p>
                <div className="border rounded-2xl p-5 bg-muted/15 shadow-sm space-y-4 font-mono text-[10px] text-muted-foreground">
                  <div className="text-center font-bold text-foreground text-xs uppercase leading-normal">
                    [SCHOOL NAME PLACEHOLDER]
                    <span className="block text-[9px] text-muted-foreground normal-case font-normal mt-0.5">
                      Term marksheets assessment
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/60 pb-2 text-[9px]">
                    <div>Student Name: [Student Name]</div>
                    <div>Admission No: [Adm No]</div>
                    <div>Class Grade: [Class Grade]</div>
                    <div>Section: [Section]</div>
                  </div>
                  <table className="w-full text-left text-[9px]">
                    <thead>
                      <tr className="border-b border-border/80 text-foreground font-bold">
                        <th>Subject Name</th>
                        <th>Max marks</th>
                        <th>Obtained marks</th>
                        <th>Subject Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/40">
                        <td>Mathematics</td>
                        <td>100</td>
                        <td>[Math Score]</td>
                        <td>[Grade]</td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td>Science Theory</td>
                        <td>100</td>
                        <td>[Sci Score]</td>
                        <td>[Grade]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => toast.success("Syllabus & marksheet template updated.")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Commit Marksheet Template
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {selectedTemplateTab === "certificates" && (
            <Panel
              title="Master Certificate templates designer (Bonafide, Transfer, LCs)"
              className="max-w-2xl"
            >
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Design standard templates for printing School Bonafide, Transfer Certificate (TC)
                  or leaving certificates.
                </p>
                <div className="border-4 border-double border-indigo-500/20 rounded-2xl p-6 bg-card shadow space-y-5 text-center text-muted-foreground">
                  <div className="font-extrabold text-foreground text-xs uppercase tracking-wide">
                    CAMPUS OS SAAS PORTAL CERTIFICATE
                  </div>
                  <div className="text-[10px] italic">This is to certify that</div>
                  <div className="text-xs font-bold text-foreground uppercase underline decoration-indigo-500/30 decoration-2">
                    [STUDENT NAME PLACEHOLDER]
                  </div>
                  <p className="text-[9px] max-w-sm mx-auto leading-relaxed">
                    has been enrolled under the academic curriculum of{" "}
                    <strong>[SCHOOL NAME PLACEHOLDER]</strong>
                    bearing Admission code <strong>[ADMISSION NUMBER]</strong> and section class{" "}
                    <strong>[CLASS GRADE]</strong>.
                  </p>
                  <div className="flex justify-between items-center text-[8px] pt-4 font-mono">
                    <span>Date: [ISSUED DATE]</span>
                    <span className="border-t border-border w-24 pt-1 font-bold text-foreground">
                      [PRINCIPAL SIGNATURE]
                    </span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => toast.success("Certificate templates updated.")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Commit Certificate templates
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {selectedTemplateTab === "idcard" && (
            <Panel title="Master ID Card visual designer" className="max-w-md">
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Global preview for standard student/staff ID cards layout templates.
                </p>
                <div className="border border-border rounded-xl p-4 w-64 mx-auto bg-card shadow-lg flex items-center gap-3 bg-gradient-to-r from-card to-indigo-500/5">
                  <div className="h-14 w-12 border rounded bg-muted grid place-items-center text-muted-foreground shrink-0 font-bold text-[8px]">
                    Photo
                  </div>
                  <div className="space-y-1 flex-1 leading-none">
                    <strong className="text-xs font-bold text-foreground block">
                      [NAME PLACEHOLDER]
                    </strong>
                    <span className="text-[9px] text-indigo-500 block uppercase font-bold">
                      Class: [CLASS]
                    </span>
                    <span className="text-[8px] text-muted-foreground block">Roll No: [ROLL]</span>
                    <span className="text-[8px] text-muted-foreground block font-mono text-[7px] truncate font-bold">
                      School: [SCHOOL NAME]
                    </span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => toast.success("ID card template registered.")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Commit ID Card Template
                  </button>
                </div>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
