import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  Hand,
  Settings,
  PhoneOff,
  LayoutGrid,
  BarChart,
  UserCheck,
  Maximize2,
  Copy,
  CalendarClock,
  ShieldAlert,
  Radio,
  Siren,
  BellRing,
  ExternalLink,
  PlayCircle,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

type LiveClassSession = {
  id: string;
  title: string;
  subject: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  provider: "GOOGLE_MEET" | "ZOOM" | "OTHER";
  meetingLink: string;
  meetingCode?: string;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  recordingUrl?: string;
  studyMaterialLinks?: string[];
  className?: string;
  sectionName?: string;
  teacherName?: string;
};

type EmergencyAlert = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  targetAudience: string;
  sourceName: string;
  sourceRole: string;
  status: string;
  createdAt: string;
};

type SchoolOption = {
  _id: string;
  name: string;
};

type PaginatedResponse<T> = {
  data: T[];
};

export const Route = createFileRoute("/teacher/live-class")({
  head: () => ({ meta: [{ title: "Live Virtual Classroom · Campus OS" }] }),
  component: LiveClassPage,
});

function LiveClassPage() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<"participants" | "chat" | "polls" | "schedule" | "emergency">(
    "participants",
  );
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveClassSession[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [classes, setClasses] = useState<SchoolOption[]>([]);
  const [sections, setSections] = useState<SchoolOption[]>([]);
  const [teacherName, setTeacherName] = useState("Teacher");

  const [form, setForm] = useState({
    title: "Physics Live Class",
    subject: "Physics",
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    durationMinutes: 45,
    provider: "GOOGLE_MEET",
    meetingLink: "",
    meetingCode: "",
    classId: "",
    sectionId: "",
    description: "",
  });

  const [emergencyForm, setEmergencyForm] = useState({
    title: "Teacher SOS",
    message: "Need immediate admin assistance in the live class room.",
    category: "SOS",
    severity: "HIGH",
    targetAudience: "STAFF",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sessionsRes, alertsRes, classesRes, sectionsRes] = await Promise.allSettled([
          apiClient<LiveClassSession[]>("/live-classes?limit=20"),
          apiClient<EmergencyAlert[]>("/emergencies"),
          apiClient<PaginatedResponse<SchoolOption>>("/academics/classes?limit=100"),
          apiClient<PaginatedResponse<SchoolOption>>("/academics/sections?limit=100"),
        ]);

        if (sessionsRes.status === "fulfilled") {
          const liveSessions = sessionsRes.value || [];
          setSessions(liveSessions);
          const firstTeacher = liveSessions[0]?.teacherName;
          if (firstTeacher) setTeacherName(firstTeacher);
        }

        if (alertsRes.status === "fulfilled") {
          setAlerts(alertsRes.value || []);
        }

        if (classesRes.status === "fulfilled") {
          setClasses(classesRes.value?.data || []);
        }

        if (sectionsRes.status === "fulfilled") {
          setSections(sectionsRes.value?.data || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load live class data");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeSession = sessions.find((session) => session.status === "LIVE") || sessions[0];
  const liveCount = sessions.filter((session) => session.status === "LIVE").length;
  const upcomingCount = sessions.filter((session) => session.status === "SCHEDULED").length;
  const emergencyCount = alerts.filter((alert) => alert.status === "OPEN").length;
  const demoParticipants = ["Aarav", "Riya", "Nidhi"];

  const updateForm = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEmergencyForm = (key: string, value: string) => {
    setEmergencyForm((prev) => ({ ...prev, [key]: value }));
  };

  const openMeet = async (session: LiveClassSession) => {
    try {
      const result = await apiClient<{ meetingLink: string; status: string }>(`/live-classes/${session.id}/join`, {
        method: "POST",
      });
      const target = result?.meetingLink || session.meetingLink;
      if (target) {
        window.open(target, "_blank", "noopener,noreferrer");
      }
      toast.success("Live class opened", {
        description: `${session.title} is ready in Google Meet.`,
      });
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id
            ? {
                ...item,
                status: (result?.status as LiveClassSession["status"]) || "LIVE",
              }
            : item,
        ),
      );
    } catch (error: any) {
      toast.error(error?.message || "Unable to open the live class");
    }
  };

  const handleCreateSession = async () => {
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        classId: form.classId || undefined,
        sectionId: form.sectionId || undefined,
        studyMaterialLinks: [],
      };
      const created = await apiClient<LiveClassSession>("/live-classes", {
        method: "POST",
        data: payload,
      });
      setSessions((prev) => [created, ...prev]);
      setActiveTab("schedule");
      toast.success("Live class scheduled", {
        description: created.meetingLink ? "Google Meet link is ready." : "Session saved successfully.",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to schedule live class");
    }
  };

  const handleEmergency = async () => {
    try {
      const created = await apiClient<EmergencyAlert>("/emergencies", {
        method: "POST",
        data: emergencyForm,
      });
      setAlerts((prev) => [created, ...prev]);
      toast.success("Emergency alert sent", {
        description: "The alert has been queued for school staff and admins.",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to send the emergency alert");
    }
  };

  const generateMeetLink = () => {
    setForm((prev) => ({ ...prev, provider: "GOOGLE_MEET", meetingLink: "https://meet.google.com/new" }));
    toast.success("Meet link generated", {
      description: "You can replace it later with a scheduled room if needed.",
    });
  };

  if (loading) {
    return (
      <div className="page-mesh flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">Loading live classroom...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Virtual Classroom"
        subtitle={`Run Google Meet classes, share study materials, and track emergency notices for ${teacherName}.`}
        actions={
          <>
            <button
              onClick={generateMeetLink}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Generate Meet link
            </button>
            <button
              onClick={handleCreateSession}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Schedule session
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live now" value={String(liveCount)} delta="Classes in progress" icon={Video} tone="success" />
        <StatCard
          label="Upcoming"
          value={String(upcomingCount)}
          delta="Scheduled live sessions"
          icon={CalendarClock}
          tone="info"
        />
        <StatCard
          label="Emergency alerts"
          value={String(emergencyCount)}
          delta="Open incidents"
          icon={ShieldAlert}
          tone={emergencyCount > 0 ? "warning" : "success"}
        />
        <StatCard label="Meet provider" value="Google Meet" delta="Default integration" icon={MonitorUp} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Classroom studio" action={<Maximize2 className="h-4 w-4 text-muted-foreground" />}>
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl">
                  <div className="flex h-14 items-center justify-between border-b border-white/10 bg-zinc-900/80 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 items-center gap-1.5 rounded-full bg-red-500/20 px-3 text-xs font-bold text-red-300">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        {activeSession?.status === "LIVE" ? "LIVE" : "READY"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {activeSession?.title || form.title}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {activeSession?.subject || form.subject} · {activeSession?.className || "All classes"}
                        </div>
                      </div>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded bg-white/5 text-zinc-400">
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950">
                      <div className="mb-3 rounded-full bg-blue-500/10 p-5 text-blue-400">
                        {screenShare ? <MonitorUp className="h-12 w-12" /> : <Video className="h-12 w-12" />}
                      </div>
                      <h3 className="text-lg font-semibold">{screenShare ? "Sharing your screen" : "Teacher camera"}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {screenShare
                          ? "Whiteboard, slides, or docs can be presented live."
                          : "Click start to launch the class in Google Meet."}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => setScreenShare((prev) => !prev)}
                          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                        >
                          {screenShare ? "Stop share" : "Share screen"}
                        </button>
                        {activeSession && (
                          <button
                            onClick={() => void openMeet(activeSession)}
                            className="rounded-full bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-400"
                          >
                            Open Meet
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Quick facts</span>
                        <button
                          onClick={() => {
                            if (activeSession?.meetingLink) {
                              navigator.clipboard.writeText(activeSession.meetingLink);
                              toast.success("Meet link copied");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy link
                        </button>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Provider</div>
                        <div className="mt-1 font-medium">{activeSession?.provider || form.provider}</div>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Meeting link</div>
                        <div className="mt-1 break-all font-medium">
                          {activeSession?.meetingLink || form.meetingLink || "https://meet.google.com/new"}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Materials</div>
                        <div className="mt-1 font-medium">
                          {activeSession?.studyMaterialLinks?.length || 0} linked resources
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                        Auto-attendance will be marked once the session is opened.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Panel title="Start a live class">
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                        <input
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject</label>
                        <input
                          value={form.subject}
                          onChange={(e) => updateForm("subject", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Class</label>
                          <select
                            value={form.classId}
                            onChange={(e) => updateForm("classId", e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          >
                            <option value="">All classes</option>
                            {classes.map((cls) => (
                              <option key={cls._id} value={cls._id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Section</label>
                          <select
                            value={form.sectionId}
                            onChange={(e) => updateForm("sectionId", e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Any section</option>
                            {sections.map((sec) => (
                              <option key={sec._id} value={sec._id}>
                                {sec.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Scheduled for
                          </label>
                          <input
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={(e) => updateForm("scheduledAt", e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minutes</label>
                          <input
                            type="number"
                            min={10}
                            max={240}
                            value={form.durationMinutes}
                            onChange={(e) => updateForm("durationMinutes", Number(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Google Meet link</label>
                        <input
                          value={form.meetingLink}
                          onChange={(e) => updateForm("meetingLink", e.target.value)}
                          placeholder="https://meet.google.com/new"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={generateMeetLink}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Generate Meet
                        </button>
                        <button
                          onClick={handleCreateSession}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Save session
                        </button>
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Emergency quick actions" action={<Siren className="h-4 w-4 text-red-500 animate-pulse" />}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["SOS", "Student/staff distress"],
                          ["BROADCAST", "School-wide alert"],
                          ["MISSING_STUDENT", "Missing student"],
                          ["BUS_SOS", "Bus breakdown"],
                        ].map(([category, label]) => (
                          <button
                            key={category}
                            onClick={() =>
                              setEmergencyForm((prev) => ({
                                ...prev,
                                category,
                                title: label,
                                message: label,
                              }))
                            }
                            className="rounded-lg border border-border px-3 py-2 text-left text-xs font-medium hover:bg-muted"
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <input
                        value={emergencyForm.title}
                        onChange={(e) => updateEmergencyForm("title", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Alert title"
                      />
                      <textarea
                        rows={3}
                        value={emergencyForm.message}
                        onChange={(e) => updateEmergencyForm("message", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Describe the emergency"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={emergencyForm.severity}
                          onChange={(e) => updateEmergencyForm("severity", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                        <select
                          value={emergencyForm.targetAudience}
                          onChange={(e) => updateEmergencyForm("targetAudience", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          <option value="STAFF">Staff</option>
                          <option value="TEACHERS">Teachers</option>
                          <option value="PARENTS">Parents</option>
                          <option value="STUDENTS">Students</option>
                          <option value="ALL">Everyone</option>
                        </select>
                      </div>
                      <button
                        onClick={handleEmergency}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-500"
                      >
                        <BellRing className="h-4 w-4" />
                        Send emergency alert
                      </button>
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="Upcoming sessions" action={<CalendarClock className="h-4 w-4 text-muted-foreground" />}>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
                  <Video className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No live sessions yet</p>
                  <p className="text-xs">Schedule a class to start the Google Meet flow.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 6).map((session) => (
                    <div key={session.id} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{session.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {session.className || "All classes"} {session.sectionName ? `· ${session.sectionName}` : ""} ·{" "}
                            {new Date(session.scheduledAt).toLocaleString()}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">{session.subject}</div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            session.status === "LIVE"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : session.status === "SCHEDULED"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {session.provider} · {session.durationMinutes} min
                        </div>
                        <button
                          onClick={() => void openMeet(session)}
                          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recent emergency alerts" action={<Radio className="h-4 w-4 text-red-500 animate-pulse" />}>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
                  <ShieldAlert className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No alerts raised</p>
                  <p className="text-xs">Emergency notices will appear here after they are sent.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 6).map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-foreground">{alert.title}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>
                          {alert.category} · {alert.targetAudience}
                        </span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex border-b border-border">
              {(
                [
                  ["participants", "Roster", Users],
                  ["chat", "Chat", MessageSquare],
                  ["polls", "Polls", BarChart],
                  ["schedule", "Schedule", CalendarClock],
                  ["emergency", "Emergency", ShieldAlert],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 px-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeTab === key ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "participants" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>In call</span>
                    <button className="text-primary hover:underline">Mute all</button>
                  </div>
                  <div className="space-y-1">
                    {demoParticipants.map((name, index) => (
                      <div
                        key={`${name}-${index}`}
                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-bold">
                            {String(name).charAt(0)}
                          </div>
                          <span className="text-sm">{String(name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {index % 2 === 0 ? (
                            <Mic className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <MicOff className="h-3.5 w-3.5 text-red-500/70" />
                          )}
                          {index === 0 && <Hand className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15">
                    <Users className="h-4 w-4" />
                    Breakout rooms
                  </button>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="flex flex-col">
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      10:15 AM - Aarav: Is the syllabus same?
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      10:16 AM - Riya: Yes, chapters 1-4
                    </div>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Message everyone..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {activeTab === "polls" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="mb-2 text-sm font-semibold">Pop Quiz: Thermodynamics</div>
                    <p className="mb-3 text-xs text-muted-foreground">Which law defines entropy?</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between rounded-lg bg-muted/50 p-2">
                        <span>First Law</span>
                        <span>10%</span>
                      </div>
                      <div className="flex justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 font-semibold text-blue-600">
                        <span>Second Law</span>
                        <span>85%</span>
                      </div>
                      <div className="flex justify-between rounded-lg bg-muted/50 p-2">
                        <span>Third Law</span>
                        <span>5%</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full rounded-lg bg-muted px-3 py-2 text-xs font-semibold hover:bg-muted/80">
                      End poll
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Google Meet</div>
                    <div className="mt-1 break-all text-sm font-medium">
                      {activeSession?.meetingLink || form.meetingLink || "https://meet.google.com/new"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (activeSession) {
                        void openMeet(activeSession);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join current class
                  </button>
                  <button
                    onClick={generateMeetLink}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                    Refresh Meet link
                  </button>
                </div>
              )}

              {activeTab === "emergency" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-red-600">
                      <Siren className="h-4 w-4" />
                      Emergency alert desk
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Teacher-triggered SOS and broadcast alerts are saved to the school incident log and
                      pushed to the selected audience.
                    </p>
                  </div>
                  <button
                    onClick={handleEmergency}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-500"
                  >
                    <BellRing className="h-4 w-4" />
                    Send current alert
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold text-muted-foreground">
            <button className="flex items-center gap-2 hover:text-foreground">
              <Settings className="h-4 w-4" />
              Options
            </button>
            <button className="flex items-center gap-2 hover:text-foreground">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              Auto-attendance
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMicOn((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all ${
              micOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/15"
            }`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setCamOn((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all ${
              camOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/15"
            }`}
          >
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setScreenShare((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all ${
              screenShare
                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            <MonitorUp className="h-5 w-5" />
          </button>

          <button
            onClick={() => setHandRaised((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all ${
              handRaised
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            <Hand className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => {
            if (activeSession) {
              void openMeet(activeSession);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500"
        >
          <PhoneOff className="h-5 w-5" />
          End class
        </button>

        <button className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/15">
          <UserCheck className="h-4 w-4" />
          Auto-attendance
        </button>
      </div>
    </div>
  );
}
