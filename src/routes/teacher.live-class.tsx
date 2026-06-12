import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
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
  Palette,
  Plus,
  Trash2,
  StopCircle,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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

function WhiteboardCanvas({ color }: { color: string }) {
  const canvasRefInner = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRefInner.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 240;
    ctx.strokeStyle = color;
  }, [color]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefInner.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRefInner.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRefInner.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-900 text-white">
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950 px-3 py-1 text-xs">
        <span className="font-semibold text-zinc-300">Interactive Classroom Whiteboard</span>
        <button
          onClick={clearCanvas}
          className="rounded bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/15"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRefInner}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 cursor-crosshair bg-zinc-900"
      />
    </div>
  );
}

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
  const [whiteboardMode, setWhiteboardMode] = useState(false);
  const [drawColor, setDrawColor] = useState("#3b82f6");
  const [isRecording, setIsRecording] = useState(false);
  const [newMaterialLink, setNewMaterialLink] = useState("");
  
  // Breakout state
  const [breakoutRoomsOpen, setBreakoutRoomsOpen] = useState(false);
  const [breakoutCount, setBreakoutCount] = useState(2);
  const [breakoutGroups, setBreakoutGroups] = useState<string[][]>([]);

  // Interactive Polls state
  const [createdPolls, setCreatedPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);

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

  const handleEndClass = async (session: LiveClassSession) => {
    try {
      await apiClient(`/live-classes/${session.id}`, {
        method: "PATCH",
        data: { status: "ENDED" },
      });
      toast.success("Live class ended", {
        description: `${session.title} has been completed and student attendance is auto-marked.`,
      });
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id
            ? {
                 ...item,
                 status: "ENDED",
               }
            : item,
        ),
      );
    } catch (error: any) {
      toast.error(error?.message || "Unable to end the live class");
    }
  };

  const toggleRecording = async () => {
    if (!activeSession) return;
    if (isRecording) {
      setIsRecording(false);
      try {
        const mockUrl = `/uploads/recordings/live-class-${activeSession.id}.mp4`;
        await apiClient(`/live-classes/${activeSession.id}`, {
          method: "PATCH",
          data: { recordingUrl: mockUrl },
        });
        toast.success("Recording saved", {
          description: "Recording link is now available to students.",
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, recordingUrl: mockUrl } : s))
        );
      } catch (err: any) {
        toast.error("Failed to save recording link");
      }
    } else {
      setIsRecording(true);
      toast.success("Recording started", {
        description: "Flashing red indicator means class audio/video is being recorded.",
      });
    }
  };

  const handleAddMaterial = async () => {
    if (!activeSession || !newMaterialLink.trim()) return;
    try {
      const updatedMaterials = [...(activeSession.studyMaterialLinks || []), newMaterialLink];
      await apiClient(`/live-classes/${activeSession.id}`, {
        method: "PATCH",
        data: { studyMaterialLinks: updatedMaterials },
      });
      toast.success("Study material shared!");
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, studyMaterialLinks: updatedMaterials } : s))
      );
      setNewMaterialLink("");
    } catch (err: any) {
      toast.error("Failed to share study material link");
    }
  };

  const generateBreakoutRooms = () => {
    const list = [...demoParticipants];
    list.sort(() => Math.random() - 0.5);
    const groups: string[][] = Array.from({ length: breakoutCount }, () => []);
    list.forEach((name, i) => {
      groups[i % breakoutCount].push(name);
    });
    setBreakoutGroups(groups);
    setBreakoutRoomsOpen(true);
    toast.success(`Generated ${breakoutCount} breakout rooms!`, {
      description: "Students have been distributed into discussion groups.",
    });
  };

  const handleCreatePoll = () => {
    if (!newPollQuestion.trim()) return;
    const newPoll = {
      id: Math.random().toString(),
      question: newPollQuestion,
      options: newPollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })),
      isActive: true,
    };
    setCreatedPolls([newPoll, ...createdPolls]);
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);
    toast.success("Poll launched live!");
  };

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

  const [activeSessionMeetLink, setActiveSessionMeetLink] = useState("");

  useEffect(() => {
    if (activeSession) {
      setActiveSessionMeetLink(activeSession.meetingLink || "");
    }
  }, [activeSession?.id, activeSession?.meetingLink]);

  const handleUpdateMeetLink = async () => {
    if (!activeSession) return;
    try {
      await apiClient(`/live-classes/${activeSession.id}`, {
        method: "PATCH",
        data: { meetingLink: activeSessionMeetLink },
      });
      toast.success("Meeting link updated successfully!", {
        description: "Students can now join the updated room link.",
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, meetingLink: activeSessionMeetLink } : s))
      );
    } catch (err: any) {
      toast.error("Failed to update meeting link");
    }
  };

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
      let finalLink = form.meetingLink;
      let finalCode = form.meetingCode;
      if (!finalLink) {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        finalCode = `${part(3)}-${part(4)}-${part(3)}`;
        finalLink = `https://meet.google.com/${finalCode}`;
      }

      const payload = {
        ...form,
        meetingLink: finalLink,
        meetingCode: finalCode,
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
        description: `Google Meet link: ${created.meetingLink}`,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to schedule live class");
    }
  };

  const handleStartClassNow = async () => {
    try {
      let finalLink = form.meetingLink;
      let finalCode = form.meetingCode;
      if (!finalLink) {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        finalCode = `${part(3)}-${part(4)}-${part(3)}`;
        finalLink = `https://meet.google.com/${finalCode}`;
      }

      const payload = {
        ...form,
        title: form.title || "Quick Live Lecture",
        subject: form.subject || "General",
        meetingLink: finalLink,
        meetingCode: finalCode,
        scheduledAt: new Date().toISOString(),
        durationMinutes: form.durationMinutes || 45,
        status: "LIVE",
        classId: form.classId || undefined,
        sectionId: form.sectionId || undefined,
        studyMaterialLinks: [],
      };
      const created = await apiClient<LiveClassSession>("/live-classes", {
        method: "POST",
        data: payload,
      });

      setSessions((prev) => [created, ...prev]);
      
      // Open the Google Meet immediately in a new tab
      window.open(created.meetingLink, "_blank", "noopener,noreferrer");

      toast.success("Live class started!", {
        description: `Redirecting to Google Meet room: ${created.meetingLink}`,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to start live class");
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
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const code = `${part(3)}-${part(4)}-${part(3)}`;
    setForm((prev) => ({ ...prev, provider: "GOOGLE_MEET", meetingLink: `https://meet.google.com/${code}`, meetingCode: code }));
    toast.success("Meet link generated", {
      description: `Unique room: meet.google.com/${code}`,
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
              onClick={handleStartClassNow}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 shadow-md cursor-pointer transition-all"
            >
              Start Class Now
            </button>
            <button
              onClick={generateMeetLink}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted cursor-pointer"
            >
              Generate Meet link
            </button>
            <button
              onClick={handleCreateSession}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
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
                    <button 
                      onClick={() => setWhiteboardMode(!whiteboardMode)}
                      className={cn("grid h-8 w-8 place-items-center rounded bg-white/5 text-zinc-400 hover:text-white transition-colors", whiteboardMode && "bg-white/10 text-white")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div className="relative flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950">
                      {whiteboardMode ? (
                        <div className="absolute inset-0 flex flex-col bg-zinc-900">
                          <WhiteboardCanvas color={drawColor} />
                          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 p-1.5">
                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#ffffff"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setDrawColor(c)}
                                className={cn(
                                  "h-4 w-4 rounded-full border border-white/20 transition-transform cursor-pointer",
                                  drawColor === c && "scale-125 border-white"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3 rounded-full bg-blue-500/10 p-5 text-blue-400">
                            {screenShare ? <MonitorUp className="h-12 w-12" /> : <Video className="h-12 w-12" />}
                          </div>
                          <h3 className="text-lg font-semibold">{screenShare ? "Sharing your screen" : "Teacher camera"}</h3>
                          <p className="mt-1 text-sm text-zinc-400 text-center px-4">
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
                        </>
                      )}
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
                      <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Meeting link</div>
                        {activeSession ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              value={activeSessionMeetLink}
                              onChange={(e) => setActiveSessionMeetLink(e.target.value)}
                              placeholder="https://meet.google.com/abc-defg-hij"
                              className="flex-1 rounded border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary font-medium text-foreground"
                            />
                            <button
                              onClick={handleUpdateMeetLink}
                              className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                            >
                              Update
                            </button>
                          </div>
                        ) : (
                          <div className="break-all font-medium text-foreground">
                            {form.meetingLink || "https://meet.google.com/new"}
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Real GMeet Guide:</span> Google Meet requires room links to be generated on their server. If you start a new room, please copy the URL (e.g. <code>meet.google.com/abc-defg-hij</code>) and paste it here, then click Update so students join the exact same meeting room.
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Materials</div>
                        <div className="mt-1 font-medium">
                          {activeSession?.studyMaterialLinks?.length || 0} linked resources
                        </div>
                        {activeSession && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <input
                              placeholder="Share link..."
                              value={newMaterialLink}
                              onChange={(e) => setNewMaterialLink(e.target.value)}
                              className="flex-1 rounded border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-primary"
                            />
                            <button
                              onClick={handleAddMaterial}
                              className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                              Add
                            </button>
                          </div>
                        )}
                        {activeSession?.studyMaterialLinks && activeSession.studyMaterialLinks.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                            {activeSession.studyMaterialLinks.map((link, idx) => (
                              <li key={idx} className="truncate">
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
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
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={generateMeetLink}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Generate Link
                        </button>
                        <button
                          onClick={handleCreateSession}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-2 text-xs font-semibold hover:bg-primary/15 cursor-pointer"
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                          Schedule
                        </button>
                        <button
                          onClick={handleStartClassNow}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer shadow-sm animate-pulse"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start Now
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
                  <button
                    onClick={generateBreakoutRooms}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
                  >
                    <Users className="h-4 w-4" />
                    Launch Breakout rooms ({breakoutCount})
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Number of rooms:</span>
                    <div className="flex items-center gap-1">
                      {[2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => setBreakoutCount(num)}
                          className={cn(
                            "h-6 w-6 rounded border border-border text-xs font-semibold cursor-pointer",
                            breakoutCount === num ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {breakoutGroups.length > 0 && (
                    <div className="mt-4 space-y-3 rounded-xl border border-border p-3">
                      <div className="text-xs font-bold text-foreground">Active Breakout Groups</div>
                      {breakoutGroups.map((group, idx) => (
                        <div key={idx} className="rounded-lg bg-muted/50 p-2 text-xs">
                          <div className="font-semibold text-primary">Room {idx + 1}</div>
                          <div className="mt-1 text-muted-foreground">
                            {group.length > 0 ? group.join(", ") : "No students assigned"}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setBreakoutGroups([]);
                          toast.info("Breakout rooms dissolved.");
                        }}
                        className="w-full rounded bg-red-500/10 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/15"
                      >
                        Dissolve Rooms
                      </button>
                    </div>
                  )}
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
                  {/* Create Poll Form */}
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
                    <div className="font-semibold text-foreground">Launch New Poll</div>
                    <input
                      placeholder="Poll Question..."
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2.5 py-1.5 outline-none focus:border-primary"
                    />
                    <div className="space-y-1.5">
                      {newPollOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <input
                            placeholder={`Choice ${oIdx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...newPollOptions];
                              updated[oIdx] = e.target.value;
                              setNewPollOptions(updated);
                            }}
                            className="flex-1 rounded border border-border bg-background px-2.5 py-1 outline-none focus:border-primary"
                          />
                          {newPollOptions.length > 2 && (
                            <button
                              onClick={() => setNewPollOptions(newPollOptions.filter((_, idx) => idx !== oIdx))}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setNewPollOptions([...newPollOptions, ""])}
                        className="text-primary hover:underline"
                      >
                        + Add Choice
                      </button>
                      <button
                        onClick={handleCreatePoll}
                        className="rounded bg-primary px-3 py-1 font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Launch
                      </button>
                    </div>
                  </div>

                  {/* List of active/created polls */}
                  {createdPolls.map((poll) => (
                    <div key={poll.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="mb-2 text-sm font-semibold">{poll.question}</div>
                      <div className="space-y-2 text-xs">
                        {poll.options.map((opt: any, optIdx: number) => (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setCreatedPolls(prev =>
                                prev.map(p =>
                                  p.id === poll.id
                                    ? {
                                        ...p,
                                        options: p.options.map((o: any, idx: number) =>
                                          idx === optIdx ? { ...o, votes: o.votes + 1 } : o
                                        ),
                                      }
                                    : p
                                )
                              );
                              toast.success("Vote recorded!");
                            }}
                            className="flex w-full justify-between rounded-lg bg-muted/50 p-2 hover:bg-muted text-left"
                          >
                            <span>{opt.text || `Option ${optIdx + 1}`}</span>
                            <span className="font-bold">{opt.votes} votes</span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setCreatedPolls(createdPolls.filter(p => p.id !== poll.id));
                          toast.info("Poll removed.");
                        }}
                        className="mt-3 w-full rounded bg-red-500/10 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/15"
                      >
                        End Poll
                      </button>
                    </div>
                  ))}

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
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
              micOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/15"
            }`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setCamOn((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
              camOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "border border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/15"
            }`}
          >
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setScreenShare((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
              screenShare
                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            <MonitorUp className="h-5 w-5" />
          </button>

          <button
            onClick={() => setWhiteboardMode((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
              whiteboardMode
                ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
            title="Whiteboard"
          >
            <Palette className="h-5 w-5" />
          </button>

          <button
            onClick={toggleRecording}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
              isRecording
                ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
            title={isRecording ? "Stop recording" : "Record class"}
          >
            <Radio className="h-5 w-5" />
          </button>

          <button
            onClick={() => setHandRaised((prev) => !prev)}
            className={`grid h-12 w-12 place-items-center rounded-full transition-all cursor-pointer ${
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
              void handleEndClass(activeSession);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 cursor-pointer"
        >
          <PhoneOff className="h-5 w-5" />
          End class
        </button>

        <button
          onClick={() => {
            if (activeSession) {
              void handleEndClass(activeSession);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/15 cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          Auto-attendance
        </button>
      </div>
    </div>
  );
}
