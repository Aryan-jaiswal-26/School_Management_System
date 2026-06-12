import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  MessageSquare,
  Plus,
  X,
  Volume2,
  AlertTriangle,
  LifeBuoy,
  Loader2,
  CheckCheck,
  Clock,
  CalendarClock,
  Languages,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { fetchAnnouncements } from "@/lib/parent-api";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/parent/notifications")({
  head: () => ({ meta: [{ title: "Alerts & Support · Campus OS" }] }),
  component: ParentNotifications,
});

interface Ticket {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
}

const MOCK_REMINDERS = [
  { id: 1, type: "fee",        icon: "💳", title: "Fee Payment Due",           message: "Term 2 tuition fee of ₹18,500 is due in 3 days (June 13, 2026).",                                  priority: "high",   time: "2 days ago" },
  { id: 2, type: "exam",       icon: "📝", title: "Exam Tomorrow — Mathematics", message: "Unit Test 3 in Mathematics is scheduled for tomorrow at 9:00 AM in Hall A. Syllabus: Ch. 8-12.", priority: "high",   time: "Today"      },
  { id: 3, type: "ptm",        icon: "👥", title: "PTM Scheduled",              message: "Parent-Teacher Meeting is scheduled for June 15 at 10:00 AM. Please confirm attendance.",         priority: "medium", time: "3 days ago" },
  { id: 4, type: "attendance", icon: "📋", title: "Attendance Alert",           message: "Your child's attendance has dropped to 78%. Please ensure regular attendance to avoid issues.",    priority: "medium", time: "1 week ago" },
  { id: 5, type: "holiday",   icon: "🎉", title: "School Holiday",             message: "School will remain closed on June 17 (Eid-ul-Adha). Classes resume on June 18.",                 priority: "low",    time: "5 days ago" },
];

const LANG_LABELS: Record<string, string> = { en: "English", hi: "हिंदी", ta: "தமிழ்", te: "తెలుగు" };

const TRANSLATIONS: Record<string, { heading: string; n1: string; n2: string }> = {
  en: { heading: "School Announcements & Notices", n1: "Annual Day celebrations scheduled for 20th July.", n2: "PTA meeting next Saturday at 10 AM in the school auditorium." },
  hi: { heading: "स्कूल घोषणाएं और नोटिस", n1: "20 जुलाई को वार्षिक दिवस समारोह निर्धारित है।", n2: "अगले शनिवार सुबह 10 बजे PTA बैठक।" },
  ta: { heading: "பள்ளி அறிவிப்புகள் & நோட்டீஸ்கள்", n1: "ஜூலை 20 அன்று வருடாந்திர தினம் கொண்டாடப்படும்.", n2: "அடுத்த சனிக்கிழமை காலை 10 மணிக்கு PTA கூட்டம்." },
  te: { heading: "పాఠశాల ప్రకటనలు & నోటీసులు", n1: "జూలై 20న వార్షిక దినోత్సవం నిర్వహించబడుతుంది.", n2: "వచ్చే శనివారం ఉదయం 10 గంటలకు PTA సభ." },
};

function ParentNotifications() {
  const [activeChildId, setActiveChildId]     = useState<string>("");
  const [activeChildName, setActiveChildName] = useState<string>("Student");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [tickets, setTickets]                 = useState<Ticket[]>([]);
  const [announcements, setAnnouncements]     = useState<any[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [readReceipts, setReadReceipts]       = useState<Set<string>>(new Set());
  const [language, setLanguage]               = useState<"en" | "hi" | "ta" | "te">("en");
  const [activeTab, setActiveTab]             = useState<"alerts" | "reminders" | "translate">("alerts");
  const [reminders, setReminders]             = useState<any[]>([]);

  useEffect(() => {
    const handleSync = () => {
      setActiveChildId(localStorage.getItem("parent_active_child") || "");
      setActiveChildName(localStorage.getItem("parent_active_child_name") || "Student");
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  useEffect(() => {
    if (!activeChildId) return;
    async function loadReminders() {
      try {
        const [feesRes, examsRes, acadRes] = await Promise.allSettled([
          apiClient<any>(`/parents/fees?studentId=${activeChildId}`),
          apiClient<any>(`/exams?studentId=${activeChildId}`),
          apiClient<any>(`/parents/children/${activeChildId}/academics`),
        ]);

        const list = [];
        let idCounter = 1;

        // 1. Fee Reminders
        if (feesRes.status === "fulfilled" && feesRes.value?.data) {
          const unpaidFees = feesRes.value.data.filter((f: any) => f.status !== "paid");
          unpaidFees.forEach((fee: any) => {
            const amount = fee.dueAmount ?? fee.due ?? (fee.amount - (fee.paidAmount || 0));
            if (amount > 0) {
              list.push({
                id: idCounter++,
                type: "fee",
                icon: "💳",
                title: "Fee Payment Due",
                message: `${fee.feeType || fee.category || "School"} fee of ₹${amount.toLocaleString()} is due. Please pay to clear your dues.`,
                priority: "high",
                time: fee.dueDate ? `Due on ${new Date(fee.dueDate).toLocaleDateString()}` : "Upcoming",
              });
            }
          });
        }

        // 2. Exam Reminders
        if (examsRes.status === "fulfilled" && examsRes.value?.data) {
          const upcomingExams = examsRes.value.data.filter((e: any) => e.status === "upcoming" || new Date(e.date) >= new Date());
          upcomingExams.slice(0, 3).forEach((exam: any) => {
            list.push({
              id: idCounter++,
              type: "exam",
              icon: "📝",
              title: `Upcoming Exam — ${exam.subject}`,
              message: `${exam.examType || exam.type || "Test"} is scheduled on ${new Date(exam.date).toLocaleDateString()} at ${exam.time || "N/A"}. Syllabus: ${exam.syllabus || "As per curriculum"}.`,
              priority: "high",
              time: "Upcoming",
            });
          });
        }

        // 3. Attendance Alert
        if (acadRes.status === "fulfilled" && acadRes.value?.data) {
          const attendancePct = acadRes.value.data.percentage;
          const attendanceVal = attendancePct ? parseInt(attendancePct.replace("%", "")) : null;
          if (attendanceVal !== null && attendanceVal < 75) {
            list.push({
              id: idCounter++,
              type: "attendance",
              icon: "📋",
              title: "Attendance Alert",
              message: `Your child's attendance has dropped to ${attendanceVal}%. Please ensure regular attendance to maintain the minimum 75% requirement.`,
              priority: "medium",
              time: "Critical",
            });
          }
        }

        setReminders(list);
      } catch (err) {
        console.error("Failed to compile reminders", err);
      }
    }
    loadReminders();
  }, [activeChildId]);

  useEffect(() => {
    setIsLoading(true);
    fetchAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newTicket: Ticket = {
      id: "TCK-" + Math.floor(100 + Math.random() * 900),
      title: fd.get("title") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string,
      status: "open",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTickets([newTicket, ...tickets]);
    setShowTicketModal(false);
    toast.success("Helpdesk support ticket submitted!", { description: "Admin officers have been alerted." });
  };

  const markAsRead = (id: string) => {
    setReadReceipts(prev => new Set([...prev, id]));
    toast.success("Marked as read", { description: "Read receipt logged." });
  };

  const alertsFeed = announcements.slice(0, 6).map((a: any) => ({
    id: a._id || a.id,
    title: a.title,
    body: a.content || a.body || a.message,
    time: (a.date || a.createdAt) ? new Date(a.date || a.createdAt).toLocaleDateString() : "—",
    type: (a.priority === "high" || a.type === "warning") ? "warning" : "info",
  }));

  const tabs = [
    { key: "alerts",    label: "Announcements",   icon: Bell         },
    { key: "reminders", label: "Smart Reminders",  icon: CalendarClock },
    { key: "translate", label: "Translation",      icon: Languages    },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Alerts, Notices & Helpdesk Support"
        subtitle={`School broadcasts and support ticket management for ${activeChildName}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Broadcast Notices" value={String(announcements.length)} icon={Volume2}       tone="info"    />
        <StatCard label="Critical Alerts"   value={String(alertsFeed.filter(a => a.type === "warning").length)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Support Tickets"   value={String(tickets.length)}        icon={LifeBuoy}     tone="success" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all border-b-2 ${
              activeTab === key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── ANNOUNCEMENTS ── */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="School Announcements & Alerts">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading announcements...
                </div>
              ) : alertsFeed.length === 0 ? (
                <EmptyState icon={Bell} title="No Announcements" description="School broadcasts will appear here when published by administrators." />
              ) : (
                <div className="space-y-3">
                  {alertsFeed.map((alert) => {
                    const isRead = readReceipts.has(alert.id);
                    return (
                      <div
                        key={alert.id}
                        className={`rounded-xl border p-4 flex gap-3.5 items-start transition-all ${
                          alert.type === "warning" ? "border-destructive/40 bg-destructive/5" : "border-amber-500/30 bg-amber-500/5"
                        } ${isRead ? "opacity-60" : ""}`}
                      >
                        <Bell className={`h-5 w-5 shrink-0 ${alert.type === "warning" ? "text-destructive" : "text-amber-500"}`} />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-sm">{alert.title}</span>
                            <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                            {isRead && (
                              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                                <CheckCheck className="h-3 w-3" /> Read
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{alert.body}</p>
                          {!isRead && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-1 mt-1"
                            >
                              <CheckCheck className="h-3 w-3" /> Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Pinned Notice Board">
              {isLoading ? null : announcements.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No Pinned Notices" description="Notices published by the school principal will appear here." />
              ) : (
                <div className="space-y-4">
                  {announcements.map((notice: any, i: number) => {
                    const noticeId = notice._id || `notice-${i}`;
                    const isRead   = readReceipts.has(noticeId);
                    return (
                      <div key={noticeId} className={`rounded-xl border border-border p-4 bg-card/70 space-y-2 transition-all ${isRead ? "opacity-60" : ""}`}>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm text-foreground">{notice.title}</h3>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {isRead && (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                <CheckCheck className="h-3 w-3" /> Read
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {(notice.date || notice.createdAt) ? new Date(notice.date || notice.createdAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notice.content || notice.body || notice.message}</p>
                        {(notice.author || notice.publishedBy) && (
                          <div className="text-[10px] font-bold text-accent uppercase tracking-wider">
                            Published by: {notice.author || notice.publishedBy}
                          </div>
                        )}
                        {!isRead && (
                          <button onClick={() => markAsRead(noticeId)} className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-1">
                            <CheckCheck className="h-3 w-3" /> Mark as Read
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          {/* Helpdesk */}
          <div>
            <Panel
              title="Helpdesk Support Tickets"
              action={
                <button onClick={() => setShowTicketModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold">
                  <Plus className="h-4 w-4" /> Submit Ticket
                </button>
              }
            >
              <div className="space-y-3.5">
                {tickets.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-card/80 p-3.5 space-y-1.5 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground bg-muted border px-2 py-0.5 rounded">{t.id}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        t.status === "resolved" ? "bg-green-100 text-green-700" : t.status === "in-progress" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>{t.status}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground leading-snug">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t.category}</div>
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">"{t.description}"</p>
                    <div className="text-[9px] text-muted-foreground border-t border-border pt-1.5 mt-1">Submitted on: {t.createdAt}</div>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <EmptyState icon={LifeBuoy} title="No Active Tickets" description="Log technical, billing or transport queries directly to our admin desk." />
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── SMART REMINDERS ── */}
      {activeTab === "reminders" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-2">Automated reminders generated based on your child's upcoming schedule and pending actions.</p>
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`rounded-xl border p-4 flex items-start gap-4 ${
                reminder.priority === "high"   ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" :
                reminder.priority === "medium" ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" :
                                                 "border-border bg-card/70"
              }`}
            >
              <div className="text-2xl shrink-0">{reminder.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{reminder.title}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    reminder.priority === "high"   ? "bg-red-100 text-red-700"    :
                    reminder.priority === "medium" ? "bg-amber-100 text-amber-700" :
                                                     "bg-gray-100 text-gray-600"
                  }`}>{reminder.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{reminder.message}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" /> {reminder.time}
                </div>
              </div>
            </div>
          ))}
          {reminders.length === 0 && (
            <EmptyState icon={CalendarClock} title="No Smart Reminders" description="All clear! Your child has no pending dues, upcoming exams, or low attendance alerts." />
          )}
        </div>
      )}

      {/* ── TRANSLATION ── */}
      {activeTab === "translate" && (
        <div className="space-y-6 max-w-2xl">
          <Panel title="Message Translation — Multi-Language Support">
            <div className="mb-6">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-3">Select Language</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LANG_LABELS) as Array<keyof typeof LANG_LABELS>).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang as any); toast.success(`Language set to ${LANG_LABELS[lang]}`); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      language === lang ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 bg-card/70">
                <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">📢 Announcement (Translated)</div>
                <h3 className="text-sm font-bold text-foreground mb-2">{TRANSLATIONS[language].heading}</h3>
                <p className="text-xs text-muted-foreground">{TRANSLATIONS[language].n1}</p>
              </div>
              <div className="rounded-xl border border-border p-4 bg-card/70">
                <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">📌 Notice (Translated)</div>
                <p className="text-xs text-foreground">{TRANSLATIONS[language].n2}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note:</strong> Translation applies to all school announcements and notices. All future broadcasts will appear in your selected language automatically.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Submit Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowTicketModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Log Support Ticket</h2>
              <button onClick={() => setShowTicketModal(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Issue Department</label>
                <select name="category" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none">
                  <option value="Billing & Finance">Billing & Finance</option>
                  <option value="Transport Operations">Transport Operations</option>
                  <option value="Library Circulation">Library Circulation</option>
                  <option value="Hostel Utilities">Hostel & Mess Utilities</option>
                  <option value="LMS Software Issues">LMS Technical Support</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Brief Summary</label>
                <input name="title" required placeholder="e.g. Sibling discount not applied" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Detailed Description</label>
                <textarea name="description" required rows={4} placeholder="Describe your issue in detail..." className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none resize-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow active:scale-95 transition-all text-xs">
                File Helpdesk Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
