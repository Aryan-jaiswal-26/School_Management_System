import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  Radio,
  Flame,
  AlertTriangle,
  Siren,
  Camera,
  Lock,
  Shield,
  PhoneCall,
  BellRing,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

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
  acknowledgedByCount?: number;
};

export const Route = createFileRoute("/admin/safety")({
  head: () => ({ meta: [{ title: "Safety & Emergency · Campus OS" }] }),
  component: SafetyPage,
});

function SafetyPage() {
  const [lockdown, setLockdown] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient<EmergencyAlert[]>("/emergencies");
        setAlerts(data || []);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load safety alerts");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const pushAlert = async (payload: {
    title: string;
    message: string;
    category: string;
    severity: string;
    targetAudience: string;
  }) => {
    const created = await apiClient<EmergencyAlert>("/emergencies", {
      method: "POST",
      data: payload,
    });
    setAlerts((prev) => [created, ...prev]);
    return created;
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("Message required");
      return;
    }

    try {
      await pushAlert({
        title: "Emergency broadcast",
        message: broadcastMessage,
        category: "BROADCAST",
        severity: "HIGH",
        targetAudience: "ALL",
      });
      toast.success("Emergency broadcast sent", {
        description: "Push notifications and SMS have been queued for the selected audience.",
      });
      setBroadcastMessage("");
    } catch (error: any) {
      toast.error(error?.message || "Emergency broadcast failed");
    }
  };

  const toggleLockdown = async () => {
    try {
      const nextLockdown = !lockdown;
      setLockdown(nextLockdown);

      if (nextLockdown) {
        await pushAlert({
          title: "Campus lockdown activated",
          message: "Security locked all gates and initiated the lockdown protocol.",
          category: "LOCKDOWN",
          severity: "CRITICAL",
          targetAudience: "STAFF",
        });
        toast.error("SYSTEM LOCKDOWN INITIATED", {
          description: "Security alerted. The campus is now in lockdown mode.",
        });
      } else {
        toast.success("LOCKDOWN LIFTED", {
          description: "Normal campus operations have resumed.",
        });
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to update lockdown state");
    }
  };

  const quickAlert = async (
    title: string,
    message: string,
    category: string,
    targetAudience: string,
  ) => {
    try {
      await pushAlert({
        title,
        message,
        category,
        severity: category === "SOS" ? "CRITICAL" : "HIGH",
        targetAudience,
      });
      toast.success(`${title} sent`);
    } catch (error: any) {
      toast.error(error?.message || "Unable to send alert");
    }
  };

  return (
    <div className={`space-y-6 transition-colors duration-1000 ${lockdown ? "bg-red-950/10" : ""}`}>
      {lockdown && (
        <div className="rounded-lg border border-red-500 bg-red-600 p-3 text-center font-bold text-white shadow-lg shadow-red-500/20">
          <div className="flex items-center justify-center gap-2">
            <Siren className="h-5 w-5" />
            ACTIVE CAMPUS LOCKDOWN IN EFFECT
            <Siren className="h-5 w-5" />
          </div>
        </div>
      )}

      <PageHeader
        title="Safety & Emergency Response"
        subtitle="Manage SOS alerts, emergency broadcasts, and campus-wide security protocols."
        actions={
          <button
            onClick={toggleLockdown}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              lockdown ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {lockdown ? "Lift lockdown" : "Trigger lockdown"}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Campus Status"
          value={lockdown ? "LOCKDOWN" : "SECURE"}
          icon={lockdown ? Lock : Shield}
          tone={lockdown ? "warning" : "success"}
        />
        <StatCard
          label="Open alerts"
          value={String(alerts.filter((alert) => alert.status === "OPEN").length)}
          icon={ShieldAlert}
          tone="warning"
        />
        <StatCard
          label="Critical alerts"
          value={String(alerts.filter((alert) => alert.severity === "CRITICAL").length)}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard label="Active CCTV cams" value="124" icon={Camera} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Priority emergency broadcast" action={<Radio className="h-4 w-4 text-red-500 animate-pulse" />}>
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use this for critical events only. Messages are stored as emergency alerts and dispatched to
              the selected audience.
            </p>
            <textarea
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="Enter critical broadcast message..."
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setBroadcastMessage(
                    "ALERT: Campus closed due to severe weather. Please arrange pickup immediately.",
                  )
                }
                className="rounded-md bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-muted/80"
              >
                Weather alert
              </button>
              <button
                onClick={() =>
                  setBroadcastMessage(
                    "ALERT: School buses are delayed by 45 minutes due to heavy traffic on Route 9.",
                  )
                }
                className="rounded-md bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-muted/80"
              >
                Bus delay
              </button>
              <button
                onClick={() =>
                  setBroadcastMessage("ALERT: Immediate shelter-in-place required until further notice.")
                }
                className="rounded-md bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-muted/80"
              >
                Shelter-in-place
              </button>
            </div>
            <button
              onClick={handleBroadcast}
              className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg transition-all hover:bg-red-500"
            >
              <BellRing className="mr-2 inline-block h-4 w-4" />
              Transmit emergency broadcast
            </button>
          </div>
        </Panel>

        <Panel title="Extreme measures: campus lockdown">
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-6 text-center">
            <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-red-500/20 text-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <Lock className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Initiate full lockdown</h3>
            <p className="mb-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
              This action logs the incident, notifies staff, and switches the dashboard into emergency mode.
            </p>
            <button
              onClick={toggleLockdown}
              className={`w-full rounded-xl py-3.5 font-bold uppercase tracking-widest text-white ${
                lockdown ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {lockdown ? "Lift lockdown" : "Trigger lockdown alarm"}
            </button>
          </div>
        </Panel>

        <Panel title="Quick incident actions" action={<Megaphone className="h-4 w-4 text-accent" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "SOS panic",
                title: "SOS panic button",
                message: "Urgent SOS from staff member requires immediate response.",
                category: "SOS",
                targetAudience: "STAFF",
              },
              {
                label: "Missing student",
                title: "Missing student alert",
                message: "Student location needs immediate verification.",
                category: "MISSING_STUDENT",
                targetAudience: "STAFF",
              },
              {
                label: "Fire drill",
                title: "Fire drill scheduled",
                message: "Please follow evacuation route and muster at assembly points.",
                category: "FIRE_DRILL",
                targetAudience: "ALL",
              },
              {
                label: "Bus SOS",
                title: "Bus SOS alert",
                message: "Transport unit requires urgent roadside assistance.",
                category: "BUS_SOS",
                targetAudience: "PARENTS",
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => void quickAlert(item.title, item.message, item.category, item.targetAudience)}
                className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="text-sm font-semibold text-foreground">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.message}</div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Recent emergency log" action={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading incidents...</div>
          ) : alerts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No incidents logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{alert.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{alert.message}</div>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {alert.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{alert.category}</span>
                    <span>•</span>
                    <span>{alert.severity}</span>
                    <span>•</span>
                    <span>{alert.targetAudience}</span>
                    <span>•</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="CCTV live feed monitor" action={<Camera className="h-4 w-4 text-muted-foreground" />}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { id: 1, label: "Main gate entry", active: true },
            { id: 2, label: "Cafeteria hall", active: true },
            { id: 3, label: "Playground zone", active: true },
            { id: 4, label: "Rear exit / parking", active: false },
          ].map((cam) => (
            <div
              key={cam.id}
              className="aspect-video relative overflow-hidden rounded-lg border border-border bg-zinc-900"
            >
              {cam.active ? (
                <>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  <div className="absolute left-2 top-2 flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="rounded bg-black/50 px-1 font-mono text-[10px] font-bold text-white">REC</span>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-black/50 px-1 text-[10px] font-mono text-white/70">
                    {cam.label}
                  </div>
                  <div className="flex h-full items-center justify-center">
                    <Camera className="h-6 w-6 text-white/20" />
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <AlertTriangle className="h-5 w-5 opacity-50" />
                  <span className="text-[10px] font-bold uppercase">Signal lost</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="mt-4 w-full rounded-lg bg-muted py-2 text-xs font-semibold hover:bg-muted/80">
          View all 124 cameras
        </button>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <PhoneCall className="h-4 w-4 text-red-600" />
            Direct line: law enforcement
          </div>
          <p className="mt-2 text-xs leading-relaxed">
            This panel is ready to connect to local law enforcement or internal security dispatch.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Missing student protocol
          </div>
          <p className="mt-2 text-xs leading-relaxed">
            Safety checklists and escalation steps can be attached to every incident for faster response.
          </p>
        </div>
      </div>
    </div>
  );
}
