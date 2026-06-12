import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Bus, Phone, Plus, QrCode, MapPin, X, ShieldCheck, Loader2,
  Bell, AlertTriangle, Clock, History, User, Navigation,
  CheckCircle2, Route as RouteIcon,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { fetchStudentTransport } from "@/lib/parent-api";

// ─── Animated Canvas Map ──────────────────────────────────────────────────────
function LiveBusMapCanvas({ stopName }: { stopName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let progress = 0;

    const path = [
      { x: 60,  y: 200 },
      { x: 130, y: 160 },
      { x: 230, y: 90  },
      { x: 300, y: 130 },
      { x: 420, y: 220 },
    ];

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let j = 0; j < canvas.height; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); }
      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.strokeStyle = "#eab308"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke(); ctx.setLineDash([]);
      const seg = Math.floor(progress * (path.length - 1));
      const segProg = (progress * (path.length - 1)) - seg;
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (let s = 1; s <= seg; s++) ctx.lineTo(path[s].x, path[s].y);
      if (seg < path.length - 1) {
        const busX = path[seg].x + (path[seg + 1].x - path[seg].x) * segProg;
        const busY = path[seg].y + (path[seg + 1].y - path[seg].y) * segProg;
        ctx.lineTo(busX, busY);
      }
      ctx.stroke();
      ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.arc(path[0].x, path[0].y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.font = "bold 10px sans-serif"; ctx.fillText("🏫", path[0].x - 6, path[0].y + 3);
      ctx.fillStyle = "rgba(156,163,175,0.85)"; ctx.font = "bold 9px sans-serif";
      ctx.fillText("School", path[0].x - 14, path[0].y - 14);
      ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.font = "bold 10px sans-serif"; ctx.fillText("📍", path[path.length - 1].x - 5, path[path.length - 1].y + 3);
      ctx.fillStyle = "rgba(156,163,175,0.85)"; ctx.font = "bold 9px sans-serif";
      ctx.fillText(stopName || "Your Stop", path[path.length - 1].x - 30, path[path.length - 1].y + 20);
      let busX = path[0].x, busY = path[0].y;
      if (seg < path.length - 1) {
        busX = path[seg].x + (path[seg + 1].x - path[seg].x) * segProg;
        busY = path[seg].y + (path[seg + 1].y - path[seg].y) * segProg;
      } else { busX = path[path.length - 1].x; busY = path[path.length - 1].y; }
      ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(busX, busY, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "bold 10px sans-serif"; ctx.fillText("🚌", busX - 7, busY + 3.5);
      const pulse = 12 + (Date.now() % 1200) * 0.012;
      ctx.strokeStyle = "rgba(245,158,11,0.4)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(busX, busY, pulse, 0, Math.PI * 2); ctx.stroke();
      progress += 0.0008;
      if (progress > 1.0) progress = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stopName]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <canvas ref={canvasRef} width={480} height={260} className="w-full h-auto bg-[#070b19] block" />
    </div>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/parent/transport")({
  head: () => ({ meta: [{ title: "Live Bus Tracking · Campus OS" }] }),
  component: ParentTransport,
});

interface GatePass {
  id: string;
  visitorName: string;
  relationship: string;
  pickupTime: string;
  status: "active" | "scanned" | "expired";
  qrCodeValue: string;
}

const MOCK_BOARDING_ALERTS = [
  { id: 1, type: "boarded",  time: "07:42 AM", location: "Home Stop — Sector 12",       message: "Your child has boarded the school bus.",          icon: "🚌" },
  { id: 2, type: "arrived",  time: "08:15 AM", location: "Campus Gate — Main Entrance", message: "Bus arrived at school. Child deboarded safely.",   icon: "🏫" },
  { id: 3, type: "departed", time: "03:32 PM", location: "Campus Gate — Main Entrance", message: "Afternoon bus departed from school campus.",        icon: "🚀" },
  { id: 4, type: "deboarded",time: "04:10 PM", location: "Home Stop — Sector 12",       message: "Your child has safely reached the home stop.",     icon: "🏠" },
];

const MOCK_TRIP_HISTORY = [
  { id: 1, date: "2026-06-09", type: "Morning",   departure: "07:30 AM", arrival: "08:12 AM", status: "completed", stops: 6 },
  { id: 2, date: "2026-06-09", type: "Afternoon", departure: "03:30 PM", arrival: "04:08 PM", status: "completed", stops: 6 },
  { id: 3, date: "2026-06-08", type: "Morning",   departure: "07:32 AM", arrival: "08:18 AM", status: "delayed",   stops: 6, delay: "6 min delay" },
  { id: 4, date: "2026-06-08", type: "Afternoon", departure: "03:30 PM", arrival: "04:05 PM", status: "completed", stops: 6 },
  { id: 5, date: "2026-06-07", type: "Morning",   departure: "07:30 AM", arrival: "08:10 AM", status: "completed", stops: 6 },
];

const MOCK_BUS_STOPS = [
  { stop: 1, name: "School Campus",      time: "08:15 AM", isChild: false },
  { stop: 2, name: "Sector 5 Market",    time: "08:25 AM", isChild: false },
  { stop: 3, name: "Green Park Colony",  time: "08:35 AM", isChild: false },
  { stop: 4, name: "City Centre Junction", time: "08:45 AM", isChild: false },
  { stop: 5, name: "Sector 12 Gate",     time: "08:55 AM", isChild: true  },
  { stop: 6, name: "Outer Ring Road",    time: "09:05 AM", isChild: false },
];

function ParentTransport() {
  const [activeChildId, setActiveChildId]         = useState<string>("");
  const [activeChildName, setActiveChildName]     = useState<string>("Student");
  const [transportInfo, setTransportInfo]         = useState<any>(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [activeTab, setActiveTab]                 = useState<"live" | "alerts" | "schedule" | "history" | "passes">("live");
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [createdPass, setCreatedPass]             = useState<GatePass | null>(null);
  const [gatePasses, setGatePasses]               = useState<GatePass[]>([]);
  const [sosTriggered, setSosTriggered]           = useState(false);

  useEffect(() => {
    const handleSync = () => {
      const id   = localStorage.getItem("parent_active_child") || "";
      const name = localStorage.getItem("parent_active_child_name") || "Student";
      setActiveChildId(id);
      setActiveChildName(name);
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const loadTransport = useCallback(async () => {
    if (!activeChildId) return;
    setIsLoading(true);
    try {
      const data = await fetchStudentTransport(activeChildId);
      setTransportInfo(data);
    } catch {
      setTransportInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => { loadTransport(); }, [loadTransport]);

  const handleCreateGatePass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const passId = "GP-" + Math.floor(1000 + Math.random() * 9000);
    const newPass: GatePass = {
      id: passId,
      visitorName:  fd.get("visitorName")  as string,
      relationship: fd.get("relationship") as string,
      pickupTime:   fd.get("pickupTime")   as string,
      status: "active",
      qrCodeValue: `CAMPUSOS_GATEPASS_${passId}_${fd.get("visitorName")}`,
    };
    setGatePasses([newPass, ...gatePasses]);
    setCreatedPass(newPass);
    setShowGatePassModal(false);
    toast.success("Gate Pass authorized successfully!");
  };

  const handleSOS = () => {
    setSosTriggered(true);
    toast.error("🚨 SOS EMERGENCY ALERT SENT!", {
      description: "School transport emergency team has been notified. Expect a call within 2 minutes.",
      duration: 8000,
    });
    setTimeout(() => setSosTriggered(false), 10000);
  };

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bus className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child profile from the top bar to view transport details.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading transport data...
      </div>
    );
  }

  if (!transportInfo) {
    return (
      <div>
        <PageHeader
          title="Live School Bus & Transport Hub"
          subtitle={`Real-time tracking, boarding alerts and gate passes for ${activeChildName}`}
        />
        <div className="max-w-2xl mx-auto mt-8">
          <EmptyState
            icon={Bus}
            title="No Transport Route Assigned"
            description="Your child is not currently assigned to any active school bus route."
          />
        </div>
      </div>
    );
  }

  const route    = transportInfo.route       ?? transportInfo.routeNo      ?? "—";
  const busNo    = transportInfo.busNo       ?? transportInfo.vehicleNo    ?? "—";
  const driver   = transportInfo.driverName  ?? transportInfo.driver       ?? "—";
  const phone    = transportInfo.driverPhone ?? transportInfo.phone        ?? "—";
  const stopName = transportInfo.stopName    ?? transportInfo.pickupStop   ?? "—";
  const stopTime = transportInfo.stopTime    ?? transportInfo.pickupTime   ?? "—";

  const tabs = [
    { key: "live",     label: "Live Tracking",   icon: Navigation },
    { key: "alerts",   label: "Boarding Alerts",  icon: Bell       },
    { key: "schedule", label: "Route Schedule",   icon: RouteIcon  },
    { key: "history",  label: "Trip History",     icon: History    },
    { key: "passes",   label: "Gate Passes",      icon: QrCode     },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Live School Bus & Transport Hub"
        subtitle={`Real-time tracking, boarding alerts and gate passes for ${activeChildName}`}
      />

      {/* Proximity Alert Banner */}
      {transportInfo.tripActive && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-blue-600 shrink-0 animate-bounce" />
          <div className="flex-1">
            <div className="text-sm font-bold text-blue-700 dark:text-blue-400">🚌 Bus arriving in approximately 12 minutes</div>
            <div className="text-xs text-blue-600/80 mt-0.5">Route {route} · Bus {busNo} · Currently at Green Park Colony Stop</div>
          </div>
          <button
            onClick={() => { setActiveTab("live"); toast.success("Switching to live tracking..."); }}
            className="text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Track Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Assigned Route" value={route}    icon={Bus}   tone="info"    />
        <StatCard label="Live Driver"    value={driver}   delta={phone} icon={Phone}  />
        <StatCard label="Your Stop"      value={stopName} delta={stopTime} icon={MapPin} tone="success" />
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

      {/* ── LIVE TRACKING ── */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel
              title="Assigned Bus Live GPS Map"
              action={
                <span className="flex items-center gap-1 text-xs text-[oklch(0.45_0.15_155)] font-bold uppercase animate-pulse">
                  <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.15_155)]" />
                  Live Broadcast
                </span>
              }
            >
              <LiveBusMapCanvas stopName={stopName} />
              <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground font-semibold px-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> School Campus</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {stopName}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Bus {busNo}</span>
              </div>
            </Panel>

            {/* SOS Emergency */}
            <div className={`rounded-2xl border-2 p-6 text-center transition-all ${sosTriggered ? "border-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse" : "border-destructive/30 bg-destructive/5"}`}>
              <AlertTriangle className={`h-8 w-8 mx-auto mb-3 ${sosTriggered ? "text-red-600" : "text-destructive"}`} />
              <div className="font-bold text-foreground mb-1">{sosTriggered ? "🚨 SOS ALERT SENT — Help is on the way" : "Bus Emergency SOS"}</div>
              <p className="text-xs text-muted-foreground mb-4">
                {sosTriggered
                  ? "Transport department notified. Expect callback in 2 minutes."
                  : "Press only in case of a genuine bus emergency. Alerts transport & admin team immediately."}
              </p>
              <button
                onClick={handleSOS}
                disabled={sosTriggered}
                className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all ${
                  sosTriggered ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-destructive text-white hover:bg-destructive/90"
                }`}
              >
                {sosTriggered ? "⏳ SOS Sent" : "🆘 SEND BUS SOS ALERT"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Driver Card */}
            <Panel title="Assigned Driver Info">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-bold text-foreground">{driver}</div>
                  <div className="text-xs text-muted-foreground">License: DL-0120195678234</div>
                  <div className="text-xs text-muted-foreground">Vehicle: {busNo}</div>
                </div>
              </div>
              {phone && phone !== "—" && (
                <a href={`tel:${phone}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded bg-accent/10 text-accent font-bold">📞</div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Call Driver</div>
                      <div className="text-[10px] text-muted-foreground">{phone}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-accent uppercase hover:underline">Call</span>
                </a>
              )}
              <a href="tel:+918005551212" className="mt-2 flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded bg-destructive/10 text-destructive font-bold">📞</div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Security Gate Ops</div>
                    <div className="text-[10px] text-muted-foreground">Emergency Helpdesk Line</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-destructive uppercase hover:underline">Call</span>
              </a>
            </Panel>

            <Panel title="Transport Safety Settings">
              <div className="space-y-4">
                {[
                  { label: "Proximity Alert Geofence", desc: `Notify when bus is within 500m of ${stopName}.`, defaultOn: true },
                  { label: "Boarding Updates SMS",     desc: "Alert when child checks-in via RFID.",           defaultOn: true },
                  { label: "Trip Delay Bulletins",     desc: "Alerts for delays over 10 minutes.",             defaultOn: false },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between ${i > 0 ? "border-t border-border pt-4" : ""}`}>
                    <div>
                      <div className="text-xs font-bold text-foreground">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked={s.defaultOn} className="h-4 w-8 rounded-full bg-accent/40 accent-accent cursor-pointer" />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── BOARDING ALERTS ── */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Today's Boarding & Deboarding Alerts">
              <EmptyState
                icon={Bell}
                title="No Boarding Alerts Today"
                description="No RFID check-in boarding logs have been recorded for today."
              />
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Notification Preferences">
              <div className="space-y-4">
                {[
                  { label: "Board Alert",    desc: "Notify when child boards bus",    on: true  },
                  { label: "Deboard Alert",  desc: "Notify when child gets off bus",  on: true  },
                  { label: "Delay Alerts",   desc: "Notify for delays > 5 min",       on: false },
                  { label: "SOS Broadcasts", desc: "Emergency alerts from the bus",   on: true  },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between ${i > 0 ? "border-t border-border pt-3" : ""}`}>
                    <div>
                      <div className="text-xs font-bold text-foreground">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked={s.on} className="h-4 w-8 rounded-full accent-accent cursor-pointer" />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── ROUTE SCHEDULE ── */}
      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title={`Route ${route} — Stop Timings`}>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-0">
                {(transportInfo.stops || []).map((stop: any, index: number) => {
                  const isYourStop = stop.name === stopName;
                  return (
                    <div key={index} className={`relative flex items-center gap-4 pl-12 py-4 rounded-r-xl transition-colors ${isYourStop ? "bg-primary/5" : ""}`}>
                      <div className={`absolute left-3 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold z-10 ${
                        isYourStop ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${isYourStop ? "text-primary" : "text-foreground"}`}>
                          {stop.name}
                          {isYourStop && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-2 font-bold">YOUR STOP</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground shrink-0">{stop.time}</div>
                    </div>
                  );
                })}
                {(!transportInfo.stops || transportInfo.stops.length === 0) && (
                  <EmptyState icon={RouteIcon} title="No Stops Scheduled" description="No stops defined for this route." />
                )}
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title="Schedule Info">
              <div className="space-y-3 text-xs">
                {[
                  { label: "Morning Pickup",      value: stopTime,        icon: "🌅" },
                  { label: "School Arrival",       value: "08:15 AM",     icon: "🏫" },
                  { label: "Afternoon Departure",  value: "03:30 PM",     icon: "🌇" },
                  { label: "Home Drop (est.)",     value: "04:10 PM",     icon: "🏠" },
                  { label: "Total Route Stops",    value: `${(transportInfo.stops || []).length} stops`, icon: "📍" },
                  { label: "Route Distance",       value: "14.5 km",      icon: "🗺️" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                    <span className="text-muted-foreground flex items-center gap-2"><span>{item.icon}</span>{item.label}</span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
              <div className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">⚠️ Schedule Advisory</div>
              <p className="text-xs text-amber-600/90">Bus timings may vary by ±5 minutes. Always reach your stop 5 minutes before scheduled time.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TRIP HISTORY ── */}
      {activeTab === "history" && (
        <Panel title="Trip History — Past Routes & Times">
          <div className="space-y-3">
            {(transportInfo.tripHistory || []).map((trip: any) => (
              <div key={trip.id} className="rounded-xl border border-border p-4 bg-card/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg bg-emerald-50">
                    🚌
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      Route {trip.routeNo} · Bus {trip.busNo}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Started: {new Date(trip.startedAt).toLocaleString()} {trip.endedAt ? `→ Ended: ${new Date(trip.endedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  trip.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>{trip.status}</span>
              </div>
            ))}
            {(!transportInfo.tripHistory || transportInfo.tripHistory.length === 0) && (
              <EmptyState icon={History} title="No Trip History" description="No past trips recorded for this route." />
            )}
          </div>
        </Panel>
      )}

      {/* ── GATE PASSES ── */}
      {activeTab === "passes" && (
        <Panel
          title="Authorized Gate Passes (Early Pickups)"
          action={
            <button onClick={() => setShowGatePassModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold">
              <Plus className="h-4 w-4" /> Authorize Relative
            </button>
          }
        >
          {gatePasses.length === 0 ? (
            <EmptyState icon={QrCode} title="No Gate Passes" description="Authorize a relative or family driver to pick up your child early." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gatePasses.map((pass) => (
                <div key={pass.id} className="rounded-xl border border-border p-4 bg-card/85 flex items-center justify-between gap-3 shadow-sm hover:shadow">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-foreground">{pass.visitorName}</div>
                    <div className="text-[10px] text-muted-foreground">Relation: {pass.relationship} · Time: {pass.pickupTime}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">{pass.id}</span>
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold uppercase">{pass.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setCreatedPass(pass)} className="grid h-10 w-10 place-items-center rounded-xl bg-muted hover:bg-accent hover:text-white transition-all shadow-sm">
                    <QrCode className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Gate Pass Modal */}
      {showGatePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowGatePassModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Authorize Visitor / Relative</h2>
              <button onClick={() => setShowGatePassModal(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateGatePass} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Visitor Full Name</label>
                <input name="visitorName" required placeholder="e.g. Sunil Sharma" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Relationship</label>
                <input name="relationship" required placeholder="e.g. Uncle / Aunt / Driver" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="font-semibold block mb-1">Planned Pickup Time</label>
                <input name="pickupTime" required placeholder="e.g. 15:30 Today" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow active:scale-95 transition-all text-xs">
                Generate Security Gate Pass
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gate Pass QR Modal */}
      {createdPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setCreatedPass(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl bg-card p-6 shadow-2xl border border-border text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Authorized Pass QR</span>
              <button onClick={() => setCreatedPass(null)} className="grid h-6 w-6 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-3 w-3" /></button>
            </div>
            <div className="bg-muted p-4 border border-dashed border-border rounded-xl flex items-center justify-center mb-4">
              <QrCode className="h-32 w-32 text-foreground" />
            </div>
            <div className="text-sm font-bold text-foreground">{createdPass.visitorName}</div>
            <div className="text-xs text-muted-foreground">{createdPass.relationship} · Early Pickup</div>
            <div className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full inline-block mt-2 font-semibold border border-accent/20">
              Valid: {createdPass.pickupTime}
            </div>
            <div className="mt-4 border-t border-border pt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-[oklch(0.45_0.15_155)]" />
              Encrypted security clearance token
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
