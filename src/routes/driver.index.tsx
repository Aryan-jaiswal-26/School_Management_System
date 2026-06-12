import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertOctagon,
  Bus,
  Check,
  CheckCircle2,
  Clock,
  History,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Play,
  RefreshCw,
  Square,
  User,
  Users,
  Wrench,
  X,
  Zap,
  Shield,
  ClipboardList,
  ChevronRight,
  Radio,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "Driver Cockpit · Campus OS" },
      { name: "description", content: "Bus driver app interface" },
    ],
  }),
  component: DriverCockpit,
});

// ─── Types ───────────────────────────────────────────────────────────────────
type RouteStop = { name: string; time: string; lat?: number; lng?: number };
type RouteData = {
  id: string;
  route_no: string;
  bus_no: string;
  driver_name?: string;
  driver_phone?: string;
  current_lat?: number;
  current_lng?: number;
  trip_active?: boolean;
  stops?: RouteStop[];
};
type ManifestStudent = {
  studentId?: string;
  studentName: string;
  stop?: string;
  boarded: boolean;
  boardedAt?: string | null;
  deboarded: boolean;
  deboardedAt?: string | null;
};
type TripEvent = { kind: string; message: string; createdAt: string };
type TripSession = {
  id: string;
  routeNo: string;
  busNo: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  lastLat?: number;
  lastLng?: number;
  driverAttendance?: string;
  delayReason?: string;
  delayMinutes?: number;
  maintenanceIssue?: string;
  maintenanceDetails?: string;
  sosTriggeredAt?: string;
  manifest?: ManifestStudent[];
  events?: TripEvent[];
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function fmtTime(value: string | Date = new Date()) {
  return new Date(value).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function fmtElapsed(start: string) {
  const ms = Date.now() - new Date(start).getTime();
  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Animated GPS Canvas ─────────────────────────────────────────────────────
function LiveMapCanvas({ lat, lng, routeNo }: { lat: number; lng: number; routeNo: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prog = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const path = [
      { x: 40,  y: 160 }, { x: 100, y: 120 }, { x: 190, y: 70 },
      { x: 270, y: 110 }, { x: 360, y: 170 }, { x: 430, y: 130 },
    ];
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Grid
      ctx.strokeStyle = "rgba(99,102,241,0.07)"; ctx.lineWidth = 0.8;
      for (let i = 0; i < canvas.width; i += 28)  { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
      for (let j = 0; j < canvas.height; j += 28) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(canvas.width,j); ctx.stroke(); }
      // Road shadow
      ctx.strokeStyle = "rgba(100,116,139,0.12)"; ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      // Road dashes
      ctx.strokeStyle = "rgba(148,163,184,0.18)"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 10]);
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); path.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      ctx.setLineDash([]);
      // Progress line
      const seg = Math.min(Math.floor(prog.current * (path.length - 1)), path.length - 2);
      const sp  = (prog.current * (path.length - 1)) - seg;
      ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (let s = 1; s <= seg; s++) ctx.lineTo(path[s].x, path[s].y);
      const bx = path[seg].x + (path[seg+1].x - path[seg].x) * sp;
      const by = path[seg].y + (path[seg+1].y - path[seg].y) * sp;
      ctx.lineTo(bx, by); ctx.stroke();
      // Stops
      path.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "#6366f1" : i === path.length-1 ? "#10b981" : "rgba(148,163,184,0.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 || i === path.length-1 ? 7 : 4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // Bus icon
      const pulse = 10 + (Date.now() % 1500) * 0.009;
      ctx.strokeStyle = "rgba(250,204,21,0.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(bx, by, pulse, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = "bold 10px sans-serif"; ctx.fillText("🚌", bx-6, by+4);
      // Labels
      ctx.fillStyle = "rgba(148,163,184,0.8)"; ctx.font = "bold 8px sans-serif";
      ctx.fillText("School", path[0].x-14, path[0].y-12);
      ctx.fillText("Last Stop", path[path.length-1].x-24, path[path.length-1].y+18);
      // Route label
      ctx.fillStyle = "rgba(99,102,241,0.9)"; ctx.font = "bold 9px sans-serif";
      ctx.fillText(routeNo, 8, 14);
      prog.current += 0.0006;
      if (prog.current > 1) prog.current = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [routeNo]);
  return (
    <canvas
      ref={canvasRef}
      width={480} height={200}
      className="w-full h-auto rounded-xl bg-[#0a0e1a] block"
    />
  );
}

// ─── SOS Button ──────────────────────────────────────────────────────────────
function SosButton({ onSos, active }: { onSos: () => void; active: boolean }) {
  const [held, setHeld] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    if (active) return;
    setHeld(true);
    let p = 0;
    timer.current = setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer.current!);
        setHeld(false);
        setProgress(0);
        onSos();
      }
    }, 100);
  };
  const stopHold = () => {
    if (timer.current) clearInterval(timer.current);
    setHeld(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Pulse rings */}
        {active && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <span className="absolute inset-[-8px] rounded-full bg-red-500/10 animate-ping" style={{ animationDelay: "0.3s" }} />
          </>
        )}
        <button
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          onMouseLeave={stopHold}
          disabled={active}
          className={`relative h-28 w-28 rounded-full font-black text-white text-xs tracking-widest uppercase shadow-2xl border-4 transition-all select-none flex flex-col items-center justify-center gap-1 ${
            active
              ? "bg-red-500/60 border-red-400/40 cursor-not-allowed"
              : "bg-gradient-to-br from-red-500 to-red-700 border-red-400/50 hover:from-red-600 hover:to-red-800 active:scale-95"
          }`}
        >
          {/* Hold progress ring */}
          {held && (
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="52" fill="none" stroke="white" strokeWidth="4" strokeOpacity="0.4"
                strokeDasharray={`${(progress / 100) * (2 * Math.PI * 52)} ${2 * Math.PI * 52}`} />
            </svg>
          )}
          <AlertOctagon className="h-8 w-8" />
          <span className="text-[10px] leading-tight text-center">
            {active ? "SOS ACTIVE" : held ? "HOLD..." : "HOLD FOR\nSOS"}
          </span>
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {active ? "🚨 Emergency dispatched to admin" : "Hold 3 seconds to trigger SOS"}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function DriverCockpit() {
  const { isAuthenticated, user, authLoading } = useAuth();

  const [loading, setLoading]             = useState(true);
  const [dashboard, setDashboard]         = useState<{
    driver: { id: string; fullName: string; email: string; role: string };
    route: RouteData | null;
    currentTrip: TripSession | null;
    tripHistory: TripSession[];
  } | null>(null);

  const [tab, setTab]                       = useState<"home" | "manifest" | "map" | "reports" | "history">("home");
  const [delayReason, setDelayReason]       = useState("Traffic congestion");
  const [delayMinutes, setDelayMinutes]     = useState(15);
  const [maintenanceIssue, setMaintenanceIssue]   = useState("Brakes wear and squeak");
  const [maintenanceDetails, setMaintenanceDetails] = useState("");
  const [sosActive, setSosActive]           = useState(false);
  const [coordTick, setCoordTick]           = useState(0);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [elapsed, setElapsed]               = useState("0m");
  const [manifest, setManifest]             = useState<ManifestStudent[]>([]);
  const [driverAttendance, setDriverAttendance] = useState<string>("PENDING");

  const route      = dashboard?.route ?? null;
  const activeTrip = dashboard?.currentTrip ?? null;
  const tripHistory = dashboard?.tripHistory ?? [];

  const coords = useMemo(() => {
    const baseLat = route?.current_lat ?? 18.528;
    const baseLng = route?.current_lng ?? 73.849;
    const wobble  = (coordTick % 10) * 0.00005;
    return { lat: +(baseLat + wobble).toFixed(5), lng: +(baseLng - wobble).toFixed(5) };
  }, [route?.current_lat, route?.current_lng, coordTick]);

  // ── GPS ticker when trip active ──────────────────────────────────────────
  useEffect(() => {
    if (activeTrip?.status !== "ACTIVE") return;
    const t = window.setInterval(() => setCoordTick(n => n + 1), 3000);
    return () => window.clearInterval(t);
  }, [activeTrip?.status]);

  // ── Elapsed timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTrip?.startedAt || activeTrip.status !== "ACTIVE") return;
    const t = window.setInterval(() => setElapsed(fmtElapsed(activeTrip.startedAt)), 5000);
    setElapsed(fmtElapsed(activeTrip.startedAt));
    return () => window.clearInterval(t);
  }, [activeTrip?.startedAt, activeTrip?.status]);

  // ── Fetch dashboard ──────────────────────────────────────────────────────
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient("/transport/driver/dashboard");
      const data = res?.data ?? res ?? null;
      setDashboard(data);
      setDriverAttendance(data?.currentTrip?.driverAttendance || "PENDING");
      setManifest(data?.currentTrip?.manifest?.length ? data.currentTrip.manifest : []);
    } catch {
      toast.error("Failed to load driver cockpit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "driver") fetchDashboard();
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!activeTrip?.id) return;
    setDriverAttendance(activeTrip.driverAttendance || "PRESENT");
    setManifest(activeTrip.manifest?.length ? activeTrip.manifest : []);
  }, [activeTrip?.id]);

  // ── Action helper ─────────────────────────────────────────────────────────
  const exec = async (promise: Promise<any>, msg: string) => {
    try {
      await promise;
      toast.success(msg);
      await fetchDashboard();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    }
  };

  const startTrip = () =>
    exec(
      apiClient("/transport/driver/trips/start", {
        method: "POST",
        data: { latitude: coords.lat, longitude: coords.lng, manifest },
      }),
      "🚌 Trip started — Safe journey!"
    );

  const endTrip = () =>
    exec(
      apiClient("/transport/driver/trips/end", {
        method: "POST",
        data: { latitude: coords.lat, longitude: coords.lng },
      }),
      "Trip completed. Well done!"
    );

  const markAttendance = () =>
    exec(
      apiClient("/transport/driver/attendance", { method: "POST", data: { status: "PRESENT" } }),
      "✅ Attendance marked PRESENT"
    );

  const updateManifest = (student: ManifestStudent, boarded: boolean) => {
    // Optimistic UI update
    setManifest(prev =>
      prev.map(s =>
        (s.studentId ? s.studentId === student.studentId : s.studentName === student.studentName)
          ? { ...s, boarded, boardedAt: boarded ? new Date().toISOString() : s.boardedAt, deboarded: !boarded, deboardedAt: !boarded ? new Date().toISOString() : s.deboardedAt }
          : s
      )
    );
    exec(
      apiClient("/transport/driver/trips/manifest", {
        method: "POST",
        data: {
          studentId: student.studentId,
          studentName: student.studentName,
          stop: student.stop,
          boarded,
          deboarded: !boarded,
        },
      }),
      `${student.studentName} marked ${boarded ? "boarded 🟢" : "deboarded 🔵"}`
    );
  };

  const reportDelay = () =>
    exec(
      apiClient("/transport/driver/trips/delay", {
        method: "POST",
        data: { reason: delayReason, minutes: delayMinutes },
      }),
      `⏰ Delay of ${delayMinutes} min reported to admin`
    ).then(() => setShowDelayModal(false));

  const reportMaintenance = () => {
    if (!maintenanceDetails.trim()) { toast.error("Add maintenance notes first"); return; }
    exec(
      apiClient("/transport/driver/trips/maintenance", {
        method: "POST",
        data: { issue: maintenanceIssue, details: maintenanceDetails },
      }),
      "🔧 Maintenance logged and admin notified"
    ).then(() => { setShowMaintModal(false); setMaintenanceDetails(""); });
  };

  const triggerSos = async () => {
    setSosActive(true);
    try {
      await apiClient("/transport/driver/trips/sos", {
        method: "POST",
        data: { message: `SOS from ${user?.name || "driver"} on route ${route?.route_no || "assigned route"}` },
      });
      toast.error("🚨 SOS DISPATCHED", {
        description: "Emergency team and admin notified. Help is on the way.",
        duration: 10000,
      });
      await fetchDashboard();
    } catch {
      toast.error("SOS dispatch failed — call admin directly!");
    } finally {
      setTimeout(() => setSosActive(false), 15000);
    }
  };

  const activeManifest = activeTrip?.manifest?.length ? activeTrip.manifest : manifest;
  const boardedCount   = activeManifest.filter(s => s.boarded).length;
  const droppedCount   = activeManifest.filter(s => s.deboarded).length;
  const isActive       = activeTrip?.status === "ACTIVE";

  // ── Tabs config ────────────────────────────────────────────────────────────
  const TABS = [
    { key: "home",     label: "Cockpit",    icon: Zap,          badge: isActive ? "LIVE" : undefined },
    { key: "manifest", label: "Manifest",   icon: Users,         badge: activeManifest.length ? String(activeManifest.length) : undefined },
    { key: "map",      label: "Navigation", icon: Navigation,   badge: undefined },
    { key: "reports",  label: "Reports",    icon: ClipboardList, badge: undefined },
    { key: "history",  label: "History",    icon: History,       badge: tripHistory.length ? String(tripHistory.length) : undefined },
  ] as const;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="text-sm font-semibold text-muted-foreground">Loading Driver Cockpit...</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">

      {/* ── Header Status Bar ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl p-4 border-2 flex items-center gap-4 transition-all ${
        isActive
          ? "border-emerald-400/40 bg-gradient-to-r from-emerald-950/40 to-emerald-900/20"
          : "border-border bg-card/80"
      }`}>
        <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-xl ${
          isActive ? "bg-emerald-500/20" : "bg-muted"
        }`}>
          🚌
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground text-sm truncate">{user?.name || "Driver"}</div>
          <div className="text-xs text-muted-foreground">
            {route ? `${route.route_no} · Bus ${route.bus_no}` : "No route assigned"}
          </div>
          {isActive && (
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Live · {elapsed} elapsed
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
            driverAttendance === "PRESENT" || driverAttendance === "COMPLETED"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>{driverAttendance}</span>
          <button onClick={() => void fetchDashboard()} className="text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              tab === key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === key ? "bg-white/20 text-white" :
                badge === "LIVE" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted-foreground/20 text-muted-foreground"
              }`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════ HOME / COCKPIT TAB ════════════════════════════ */}
      {tab === "home" && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Route",    value: route?.route_no || "—",         color: "text-blue-400"   },
              { label: "Boarded",  value: `${boardedCount}/${activeManifest.length}`, color: "text-emerald-400" },
              { label: "Dropped",  value: String(droppedCount),            color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] uppercase text-muted-foreground font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trip Controls */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-foreground text-sm">Trip Control</div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{isActive ? "Active" : "Idle"}</span>
              </div>
            </div>

            {/* Start / End Trip */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => void startTrip()}
                disabled={isActive || !route}
                className="flex items-center justify-center gap-2 rounded-xl py-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600"
              >
                <Play className="h-4 w-4" />
                Start Trip
              </button>
              <button
                onClick={() => void endTrip()}
                disabled={!isActive}
                className="flex items-center justify-center gap-2 rounded-xl py-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 bg-gradient-to-r from-slate-700 to-slate-600 text-white hover:from-slate-800 hover:to-slate-700"
              >
                <Square className="h-4 w-4" />
                End Trip
              </button>
            </div>

            {/* Attendance */}
            <button
              onClick={() => void markAttendance()}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-primary" /> Mark Attendance
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                driverAttendance !== "PENDING" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>{driverAttendance}</span>
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowDelayModal(true)}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left hover:bg-amber-500/10 transition-all"
            >
              <Clock className="h-5 w-5 text-amber-400 mb-2" />
              <div className="text-sm font-bold text-foreground">Report Delay</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Notify admin of bus delay</div>
              {activeTrip?.delayMinutes && (
                <div className="mt-2 text-[10px] font-bold text-amber-400">Last: {activeTrip.delayMinutes} min delay</div>
              )}
            </button>
            <button
              onClick={() => setShowMaintModal(true)}
              className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-left hover:bg-blue-500/10 transition-all"
            >
              <Wrench className="h-5 w-5 text-blue-400 mb-2" />
              <div className="text-sm font-bold text-foreground">Maintenance Log</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Log vehicle issues</div>
              {activeTrip?.maintenanceIssue && (
                <div className="mt-2 text-[10px] font-bold text-blue-400">Logged: {activeTrip.maintenanceIssue.slice(0, 20)}…</div>
              )}
            </button>
          </div>

          {/* Driver Profile Card */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                {(user?.name || "D")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground">{user?.name || "Driver"}</div>
                <div className="text-xs text-muted-foreground">{user?.email || ""}</div>
              </div>
              <Shield className="h-5 w-5 text-emerald-400 ml-auto" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Vehicle",  value: route?.bus_no        || "—" },
                { label: "Route",    value: route?.route_no      || "Unassigned" },
                { label: "Phone",    value: route?.driver_phone  || user?.phone || "N/A" },
                { label: "Stops",    value: route?.stops?.length ? `${route.stops.length} stops` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</div>
                  <div className="font-semibold text-foreground mt-0.5 truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SOS Section */}
          <div className="rounded-2xl border-2 border-red-500/20 bg-red-500/5 p-6 flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="font-bold text-foreground">Emergency SOS Panic Button</div>
              <div className="text-xs text-muted-foreground mt-1">Hold for 3 seconds to dispatch SOS to admin & emergency team</div>
            </div>
            <SosButton onSos={triggerSos} active={sosActive} />
            {activeTrip?.sosTriggeredAt && (
              <div className="text-[10px] text-red-400 font-semibold">
                Last SOS: {fmtTime(activeTrip.sosTriggeredAt)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ MANIFEST TAB ══════════════════════════════════ */}
      {tab === "manifest" && (
        <div className="space-y-3">
          {/* Summary Row */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-foreground text-sm">Student Boarding Manifest</div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-muted text-muted-foreground border border-border"
              }`}>{isActive ? "Trip Active" : "Trip Inactive"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-500/10 py-2">
                <div className="text-lg font-black text-emerald-400">{boardedCount}</div>
                <div className="text-[10px] text-emerald-600 font-semibold uppercase">Boarded</div>
              </div>
              <div className="rounded-lg bg-blue-500/10 py-2">
                <div className="text-lg font-black text-blue-400">{droppedCount}</div>
                <div className="text-[10px] text-blue-600 font-semibold uppercase">Dropped</div>
              </div>
              <div className="rounded-lg bg-muted py-2">
                <div className="text-lg font-black text-foreground">{activeManifest.length}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Total</div>
              </div>
            </div>
          </div>

          {activeManifest.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
              No students in manifest. Start a trip to load the passenger list.
            </div>
          ) : (
            activeManifest.map((student) => (
              <div
                key={student.studentId || student.studentName}
                className={`rounded-2xl border p-4 transition-all ${
                  student.deboarded ? "border-blue-500/30 bg-blue-500/5" :
                  student.boarded   ? "border-emerald-500/30 bg-emerald-500/5" :
                                      "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-black ${
                      student.deboarded ? "bg-blue-500/20 text-blue-400" :
                      student.boarded   ? "bg-emerald-500/20 text-emerald-400" :
                                          "bg-muted text-muted-foreground"
                    }`}>
                      {student.studentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-sm truncate">{student.studentName}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{student.stop || "Stop not set"}</span>
                      </div>
                      {student.boarded && student.boardedAt && (
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          Boarded {fmtTime(student.boardedAt)}
                        </div>
                      )}
                      {student.deboarded && student.deboardedAt && (
                        <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                          Deboarded {fmtTime(student.deboardedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => void updateManifest(student, true)}
                      className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                        student.boarded && !student.deboarded
                          ? "bg-emerald-500 text-white"
                          : "border border-border bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 text-muted-foreground"
                      }`}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      {student.boarded && !student.deboarded ? "✓" : "Board"}
                    </button>
                    <button
                      onClick={() => void updateManifest(student, false)}
                      className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                        student.deboarded
                          ? "bg-blue-500 text-white"
                          : "border border-border bg-card hover:bg-blue-500/10 hover:border-blue-500/30 text-muted-foreground"
                      }`}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {student.deboarded ? "✓" : "Drop"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════════ MAP / NAVIGATION TAB ══════════════════════════ */}
      {tab === "map" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Radio className="h-4 w-4 text-primary animate-pulse" />
                Live Route Navigation
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400">GPS ON</span>
              </div>
            </div>
            <div className="p-4">
              <LiveMapCanvas lat={coords.lat} lng={coords.lng} routeNo={route?.route_no || "Route"} />
              <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> School</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Bus</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Last Stop</span>
              </div>
            </div>
          </div>

          {/* Coordinates */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Live Coordinates</div>
              <div className="font-mono text-sm font-bold text-foreground mt-0.5">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            </div>
            <MapPin className="h-6 w-6 text-primary" />
          </div>

          {/* Route Stops */}
          {route?.stops && route.stops.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-bold text-sm text-foreground">
                Route Stops — {route.route_no}
              </div>
              <div className="relative px-4">
                <div className="absolute left-9 top-0 bottom-0 w-px bg-border" />
                {route.stops.map((stop, i) => (
                  <div key={`${stop.name}-${i}`} className="relative flex items-center gap-4 py-3.5">
                    <div className={`relative z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center text-[9px] font-black shrink-0 ${
                      i === 0 ? "border-primary bg-primary text-primary-foreground" :
                      i === route.stops!.length - 1 ? "border-emerald-500 bg-emerald-500 text-white" :
                      "border-border bg-card text-muted-foreground"
                    }`}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{stop.name}</div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground shrink-0">{stop.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open in Maps */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-all"
          >
            <Navigation className="h-4 w-4" />
            Open in Google Maps
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* ════════════════════ REPORTS TAB ═══════════════════════════════════ */}
      {tab === "reports" && (
        <div className="space-y-4">
          {/* Delay Report */}
          <div className="rounded-2xl border border-amber-500/20 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Clock className="h-4 w-4 text-amber-400" /> Delay Report
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-2">Reason</label>
              <select
                value={delayReason}
                onChange={e => setDelayReason(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-amber-400"
              >
                {["Traffic congestion", "Engine breakdown / flat tire", "Heavy rainfall / waterlogging", "Route deviation / road closure", "Student pickup delay", "Accident on route"].map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between text-[10px] uppercase font-semibold text-muted-foreground mb-2">
                <span>Estimated delay</span>
                <span className="text-amber-400 font-black">{delayMinutes} min</span>
              </div>
              <input type="range" min={5} max={90} step={5} value={delayMinutes}
                onChange={e => setDelayMinutes(Number(e.target.value))}
                className="w-full accent-amber-400" />
            </div>
            <button
              onClick={() => void reportDelay()}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 text-xs font-black uppercase tracking-widest shadow active:scale-95 transition-all"
            >
              <Clock className="inline h-3.5 w-3.5 mr-2" />
              Report {delayMinutes} Min Delay to Admin
            </button>
          </div>

          {/* Maintenance Log */}
          <div className="rounded-2xl border border-blue-500/20 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Wrench className="h-4 w-4 text-blue-400" /> Vehicle Maintenance Log
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-2">Issue Type</label>
              <select
                value={maintenanceIssue}
                onChange={e => setMaintenanceIssue(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-blue-400"
              >
                {["Brakes wear and squeak", "Engine oil / filter replacement", "AC cooling issue", "Cabin cleaning / seat tear", "Tyre pressure / puncture", "Horn / lights malfunction", "Other minor defect"].map(i => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-2">Detailed Notes</label>
              <textarea
                value={maintenanceDetails}
                onChange={e => setMaintenanceDetails(e.target.value)}
                rows={4}
                placeholder="Describe the issue clearly so admin/mechanic can act on it..."
                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
            <button
              onClick={reportMaintenance}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-black uppercase tracking-widest shadow active:scale-95 transition-all"
            >
              <Wrench className="inline h-3.5 w-3.5 mr-2" />
              Submit Maintenance Report
            </button>

            {/* Reminders */}
            <div className="border-t border-border pt-4">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-3">Scheduled Maintenance Reminders</div>
              <div className="space-y-2">
                {[
                  { item: "Engine Oil Change",    due: "Jun 20, 2026",  overdue: false },
                  { item: "Tyre Rotation",        due: "Jul 5, 2026",   overdue: false },
                  { item: "Brake Pad Inspection", due: "Jun 12, 2026",  overdue: true  },
                ].map(r => (
                  <div key={r.item} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                    r.overdue ? "bg-red-500/10 border border-red-500/20" : "bg-muted/40 border border-border"
                  }`}>
                    <span className={`font-semibold ${r.overdue ? "text-red-400" : "text-foreground"}`}>{r.item}</span>
                    <span className={`font-bold ${r.overdue ? "text-red-400" : "text-muted-foreground"}`}>
                      {r.overdue ? "⚠️ " : ""}Due {r.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm mb-4">
              <Check className="h-4 w-4 text-emerald-400" /> Driver Attendance
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Today's Status</div>
                <div className="text-xs text-muted-foreground mt-0.5">Mark your attendance for today's duty</div>
              </div>
              <span className={`text-sm font-black px-3 py-1.5 rounded-xl border ${
                driverAttendance !== "PENDING"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>{driverAttendance}</span>
            </div>
            {driverAttendance === "PENDING" && (
              <button
                onClick={() => void markAttendance()}
                className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black uppercase tracking-widest shadow active:scale-95 transition-all"
              >
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-2" />
                Mark Present for Today
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ HISTORY TAB ═══════════════════════════════════ */}
      {tab === "history" && (
        <div className="space-y-3">
          <div className="text-sm font-bold text-foreground">Trip History & Logs</div>

          {tripHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <History className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
              <div className="text-sm text-muted-foreground">No trip history available yet.</div>
            </div>
          ) : (
            tripHistory.map((trip, i) => (
              <div key={trip.id || i} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Trip Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                  <div>
                    <div className="text-sm font-bold text-foreground">{trip.routeNo} · {trip.busNo}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Started {fmtTime(trip.startedAt)}
                      {trip.endedAt && ` · Ended ${fmtTime(trip.endedAt)}`}
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    trip.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    trip.status === "ACTIVE"    ? "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse" :
                                                  "bg-muted border-border text-muted-foreground"
                  }`}>{trip.status}</span>
                </div>

                {/* Trip Badges */}
                <div className="px-4 py-3 flex flex-wrap gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    trip.driverAttendance === "PRESENT" || trip.driverAttendance === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}>👤 {trip.driverAttendance || "N/A"}</span>
                  {trip.manifest && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400">
                      👥 {trip.manifest.filter(s => s.boarded).length} boarded / {trip.manifest.filter(s => s.deboarded).length} dropped
                    </span>
                  )}
                  {trip.delayReason && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                      ⏰ {trip.delayMinutes}m — {trip.delayReason.slice(0, 20)}
                    </span>
                  )}
                  {trip.maintenanceIssue && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400">
                      🔧 {trip.maintenanceIssue.slice(0, 20)}
                    </span>
                  )}
                  {trip.sosTriggeredAt && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
                      🚨 SOS at {fmtTime(trip.sosTriggeredAt)}
                    </span>
                  )}
                </div>

                {/* Events Timeline */}
                {trip.events && trip.events.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Event Log</div>
                    <div className="space-y-1.5">
                      {trip.events.slice(0, 5).map((ev, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <span className={`shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full ${
                            ev.kind === "SOS" ? "bg-red-400" : ev.kind === "DELAY" ? "bg-amber-400" :
                            ev.kind === "BOARD" ? "bg-emerald-400" : ev.kind === "DEBOARD" ? "bg-blue-400" : "bg-muted-foreground"
                          }`} />
                          <span className="text-muted-foreground flex-1">{ev.message}</span>
                          <span className="text-[9px] text-muted-foreground/60 shrink-0">{fmtTime(ev.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════ DELAY MODAL ════════════════════════════════════ */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowDelayModal(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-foreground text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-400" /> Report Bus Delay</div>
              <button onClick={() => setShowDelayModal(false)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <select value={delayReason} onChange={e => setDelayReason(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none">
              {["Traffic congestion","Engine breakdown / flat tire","Heavy rainfall / waterlogging","Route deviation / road closure","Student pickup delay"].map(r=><option key={r}>{r}</option>)}
            </select>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold"><span className="text-muted-foreground">Minutes late</span><span className="text-amber-400">{delayMinutes} min</span></div>
              <input type="range" min={5} max={90} step={5} value={delayMinutes} onChange={e=>setDelayMinutes(Number(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <button onClick={()=>void reportDelay()} className="w-full rounded-xl bg-amber-500 text-white py-3 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
              Report Delay to Admin
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ MAINTENANCE MODAL ════════════════════════════ */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowMaintModal(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-foreground text-sm flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-400" /> Log Vehicle Issue</div>
              <button onClick={() => setShowMaintModal(false)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <select value={maintenanceIssue} onChange={e=>setMaintenanceIssue(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none">
              {["Brakes wear and squeak","Engine oil / filter replacement","AC cooling issue","Cabin cleaning / seat tear","Tyre pressure / puncture","Horn / lights malfunction","Other"].map(i=><option key={i}>{i}</option>)}
            </select>
            <textarea value={maintenanceDetails} onChange={e=>setMaintenanceDetails(e.target.value)}
              rows={4} placeholder="Describe the vehicle issue..."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-sm outline-none resize-none" />
            <button onClick={reportMaintenance} className="w-full rounded-xl bg-blue-600 text-white py-3 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
              Submit Maintenance Log
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
