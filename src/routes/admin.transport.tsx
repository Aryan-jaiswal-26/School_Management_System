import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bus,
  MapPin,
  Plus,
  X,
  Phone,
  Users,
  ShieldAlert,
  Wrench,
  Settings,
  Radio,
  Trash2,
  UserPlus,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/transport")({
  head: () => ({ meta: [{ title: "Transport · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"tracking" | "routes" | "fleet" | "geofencing">("tracking");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [assigningRoute, setAssigningRoute] = useState<any | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Fleet & Compliance State
  const [fleet, setFleet] = useState([
    {
      id: "f1",
      busNo: "MH-12-GQ-4432",
      routeNo: "Route 1",
      driver: "Rajesh Shinde",
      pucExpiry: "2026-06-12",
      insuranceExpiry: "2026-08-20",
      lastMaintenance: "2026-04-10",
      status: "healthy",
    },
    {
      id: "f2",
      busNo: "MH-12-HQ-9988",
      routeNo: "Route 2",
      driver: "Suresh Patil",
      pucExpiry: "2026-05-18",
      insuranceExpiry: "2026-06-05",
      lastMaintenance: "2026-03-22",
      status: "puc-expiring",
    },
    {
      id: "f3",
      busNo: "MH-12-JQ-5566",
      routeNo: "Route 3",
      driver: "Amit Mishra",
      pucExpiry: "2026-09-30",
      insuranceExpiry: "2026-05-14",
      lastMaintenance: "2026-05-01",
      status: "insurance-expired",
    },
  ]);

  // Geofencing Configuration State
  const [geofences, setGeofences] = useState([
    {
      id: "g1",
      name: "Main School Campus Hub",
      radius: 100,
      trigger: "both",
      alertParent: true,
      active: true,
    },
    {
      id: "g2",
      name: "Hostel Block Gate Entrance",
      radius: 50,
      trigger: "enter",
      alertParent: false,
      active: true,
    },
    {
      id: "g3",
      name: "Sector 4 Sibling Drop Point",
      radius: 80,
      trigger: "exit",
      alertParent: true,
      active: false,
    },
  ]);

  const [geofenceLogs, setGeofenceLogs] = useState([
    {
      timestamp: "20:01:05",
      bus: "MH-12-GQ-4432",
      hub: "Main School Campus Hub",
      event: "EXITED",
      parentAlert: "Sent to Ramesh Sharma (Parent)",
    },
    {
      timestamp: "19:44:12",
      bus: "MH-12-HQ-9988",
      hub: "Hostel Block Gate Entrance",
      event: "ENTERED",
      parentAlert: "Not Enabled",
    },
  ]);

  const [routesData, setRoutesData] = useState<any[]>([]);

  const fetchRoutes = async () => {
    try {
      const res = await apiClient<any>("/transport/routes");
      setRoutesData(res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch transport routes");
    }
  };

  const fetchDrivers = async () => {
    try {
      const res: any = await apiClient("/transport/drivers");
      const rows = res?.data ?? res ?? [];
      setDrivers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
      setDrivers([]);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
  }, []);

  // Simulate GPS movement
  const [positions, setPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  useEffect(() => {
    const initial: Record<string, { lat: number; lng: number }> = {};
    routesData.forEach((r) => {
      initial[r.id] = { lat: r.current_lat || 18.52, lng: r.current_lng || 73.85 };
    });
    setPositions(initial);
    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = {
            lat: next[id].lat + (Math.random() - 0.5) * 0.002,
            lng: next[id].lng + (Math.random() - 0.5) * 0.002,
          };
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [routesData]);

  const totalStudents = routesData.reduce((a, r) => a + (r.student_count || 0), 0);
  const selectedRouteData = routesData.find((r) => r.id === selectedRoute);

  return (
    <div>
      <PageHeader
        title="Transport Management"
        subtitle="GPS tracking, route management, driver assignment, and geofencing"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setAssigningRoute(null);
                setShowAssignDriverModal(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Assign Driver
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Route
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Active Buses"
          value={String(routesData.length)}
          icon={Bus}
          tone="info"
        />
        <StatCard
          label="Total Students"
          value={String(totalStudents)}
          icon={Users}
          tone="success"
        />
        <StatCard label="Routes" value={String(routesData.length)} icon={MapPin} />
        <StatCard
          label="Fleet Alert Status"
          value={String(fleet.filter((f) => f.status !== "healthy").length)}
          icon={ShieldAlert}
          tone={fleet.some((f) => f.status === "insurance-expired") ? "critical" : "warning"}
        />
      </div>

      <div className="flex flex-wrap gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["tracking", "Live Tracking"],
            ["routes", "Route Builder"],
            ["fleet", "Fleet & Compliance"],
            ["geofencing", "Geofencing Hubs"],
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

      {tab === "tracking" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Live GPS Map">
              <div className="relative h-80 rounded-lg bg-gradient-to-br from-[#1a2e5a]/10 to-accent/5 border border-border overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, oklch(0.55 0.13 255) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                {routesData.map((r) => {
                  const pos = positions[r.id] || { lat: r.current_lat || 18.52, lng: r.current_lng || 73.85 };
                  const x = ((pos.lng - 73.83) / 0.04) * 100;
                  const y = ((18.55 - pos.lat) / 0.04) * 100;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRoute(r.id)}
                      className="absolute cursor-pointer transition-all duration-1000"
                      style={{
                        left: `${Math.min(90, Math.max(5, x))}%`,
                        top: `${Math.min(90, Math.max(5, y))}%`,
                      }}
                    >
                      <div
                        className={`relative flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium shadow-lg ${selectedRoute === r.id ? "bg-accent text-accent-foreground scale-110" : "bg-card text-foreground border border-border"}`}
                      >
                        <Bus className="h-3.5 w-3.5" />
                        {r.route_no}
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[oklch(0.65_0.15_155)] animate-pulse" />
                      </div>
                    </div>
                  );
                })}
                {routesData.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No buses to track
                  </div>
                )}
              </div>
            </Panel>
          </div>
          <div className="space-y-3">
            {selectedRouteData && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm">
                <div className="font-semibold text-foreground">{selectedRouteData.route_no}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Bus {selectedRouteData.bus_no} · Driver {selectedRouteData.driver_name || "Unassigned"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Live state: {selectedRouteData.trip_active ? "Trip active" : "Idle"}
                </div>
              </div>
            )}
            {routesData.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoute(r.id)}
                className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedRoute === r.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{r.route_no}</div>
                    <div className="text-xs text-muted-foreground">{r.bus_no}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {r.student_count || 0}/{r.capacity || 0} students
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {r.driver_name} · {r.driver_phone}
                  </div>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {r.stops?.map((s: any, i: number) => (
                    <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {s.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-muted-foreground">
                    Driver: {r.driver_name || "Unassigned"}
                  </div>
                  <button
                    onClick={() => {
                      setAssigningRoute(r);
                      setShowAssignDriverModal(true);
                    }}
                    className="rounded bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent hover:bg-accent/20"
                  >
                    Assign Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "routes" && (
        <Panel
          title="Route Configuration"
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Route
            </button>
          }
        >
          <div className="space-y-4">
            {routesData.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">
                    {r.route_no} — {r.bus_no}
                  </div>
                  <div className="text-sm text-muted-foreground">{r.driver_name}</div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {r.stops?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 shrink-0">
                      <div className="text-center">
                        <div className="h-3 w-3 rounded-full bg-accent mx-auto" />
                        <div className="text-[10px] mt-1 text-muted-foreground">{s.name}</div>
                        <div className="text-[10px] font-medium">{s.time}</div>
                      </div>
                      {i < r.stops.length - 1 && <div className="h-0.5 w-8 bg-border" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {routesData.length === 0 && (
            <EmptyState icon={Bus} title="No routes" description="Add a route to get started." />
          )}
        </Panel>
      )}

      {tab === "fleet" && (
        <Panel
          title="Fleet Compliance & Maintenance Log"
          action={
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Maintenance
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">Vehicle Detail</th>
                  <th className="pb-3 px-4">Driver</th>
                  <th className="pb-3 px-4">PUC Expiry</th>
                  <th className="pb-3 px-4">Insurance Expiry</th>
                  <th className="pb-3 px-4">Last Inspected</th>
                  <th className="pb-3 px-4">Compliance Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fleet.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold">{f.busNo}</div>
                      <div className="text-xs text-muted-foreground">{f.routeNo}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{f.driver}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm">{f.pucExpiry}</div>
                      {f.status === "puc-expiring" && (
                        <div className="text-[10px] text-amber-500 font-semibold uppercase">
                          Expiring Soon!
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm">{f.insuranceExpiry}</div>
                      {f.status === "insurance-expired" && (
                        <div className="text-[10px] text-red-500 font-bold uppercase">Expired!</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {f.lastMaintenance}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${f.status === "healthy" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : f.status === "puc-expiring" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"}`}
                      >
                        {f.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setFleet((prev) =>
                            prev.map((item) =>
                              item.id === f.id
                                ? {
                                    ...item,
                                    status: "healthy",
                                    pucExpiry: "2026-11-20",
                                    insuranceExpiry: "2026-12-15",
                                    lastMaintenance: new Date().toISOString().split("T")[0],
                                  }
                                : item,
                            ),
                          );
                          toast.success(
                            `Vehicle ${f.busNo} successfully renewed (PUC & Insurance renewed for 6 months)!`,
                          );
                        }}
                        className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/20"
                      >
                        Renew Compliance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "geofencing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Panel
                title="Geofence Controls"
                action={
                  <button
                    onClick={() => setShowGeofenceModal(true)}
                    className="flex items-center gap-0.5 text-xs text-accent hover:underline font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Region
                  </button>
                }
              >
                <div className="space-y-3">
                  {geofences.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg border border-border bg-card space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{g.name}</span>
                        <input
                          type="checkbox"
                          checked={g.active}
                          onChange={(e) => {
                            setGeofences((prev) =>
                              prev.map((item) =>
                                item.id === g.id ? { ...item, active: e.target.checked } : item,
                              ),
                            );
                            toast.info(
                              `Geofence ${g.name} has been ${e.target.checked ? "Enabled" : "Disabled"}.`,
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Radius: {g.radius} meters</span>
                        <span className="capitalize">Trigger: {g.trigger}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <label className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                          <Radio className="h-3 w-3 text-red-500" />
                          Alert Parents on Violation
                        </label>
                        <input
                          type="checkbox"
                          checked={g.alertParent}
                          onChange={(e) => {
                            setGeofences((prev) =>
                              prev.map((item) =>
                                item.id === g.id
                                  ? { ...item, alertParent: e.target.checked }
                                  : item,
                              ),
                            );
                            toast.success(`Parent alert toggled for ${g.name}.`);
                          }}
                          className="h-3.5 w-3.5 rounded text-accent focus:ring-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="lg:col-span-2">
              <Panel
                title="Live Geofencing Trigger Logs"
                action={
                  <button
                    onClick={() => {
                      setGeofenceLogs([]);
                      toast.info("Logs cleared");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Logs
                  </button>
                }
              >
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {geofenceLogs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs"
                    >
                      <div className="grid h-7 w-7 place-items-center rounded bg-accent/10 text-accent font-semibold font-mono">
                        {log.timestamp}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{log.bus}</span> has{" "}
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${log.event === "ENTERED" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}
                        >
                          {log.event}
                        </span>{" "}
                        the <span className="font-medium text-foreground">{log.hub}</span> region
                        boundaries.
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                          Parent Alert: {log.parentAlert}
                        </span>
                      </div>
                    </div>
                  ))}
                  {geofenceLogs.length === 0 && (
                    <EmptyState
                      icon={Radio}
                      title="No activity recorded"
                      description="Live geofence violation events will stream here."
                    />
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </div>
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
              <h2 className="text-lg font-semibold">Add Route</h2>
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
                  await apiClient("/transport/routes", {
                    method: "POST",
                    data: {
                      routeNo: fd.get("route") as string,
                      driverName: fd.get("driver") as string,
                      driverPhone: fd.get("phone") as string,
                      busNo: fd.get("bus") as string,
                      capacity: Number(fd.get("capacity")),
                      students: 0,
                      currentLat: 18.52,
                      currentLng: 73.85,
                      stops: [
                        { name: "Start", time: "07:30", lat: 18.52, lng: 73.85 },
                        { name: "School", time: "08:20", lat: 18.545, lng: 73.835 },
                      ],
                    }
                  });
                  toast.success("Route added");
                  setShowAdd(false);
                  fetchRoutes();
                } catch (err) {
                  toast.error("Failed to add route");
                }
              }}
              className="space-y-3"
            >
              {[
                ["route", "Route No"],
                ["bus", "Bus No"],
                ["driver", "Driver Name"],
                ["phone", "Phone"],
                ["capacity", "Capacity"],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="mb-1 block text-sm font-medium">{l}</label>
                  <input
                    name={k}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Add Route
              </button>
            </form>
          </div>
        </div>
      )}
      {showAssignDriverModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowAssignDriverModal(false);
            setAssigningRoute(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Assign Bus Driver</h2>
              <button
                onClick={() => {
                  setShowAssignDriverModal(false);
                  setAssigningRoute(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const routeId = String(fd.get("routeId") || assigningRoute?.id || "");
                const driverId = String(fd.get("driverId") || "");
                const driver = drivers.find((item) => item.id === driverId);

                if (!routeId || !driver) {
                  toast.error("Please select a route and driver");
                  return;
                }

                try {
                  await apiClient(`/transport/routes/${routeId}`, {
                    method: "PATCH",
                    data: {
                      driverProfileId: driver.user?._id || null,
                      driverName: `${driver.user?.firstName || driver.firstName || ""} ${driver.user?.lastName || driver.lastName || ""}`.trim() || driver.employeeId,
                      driverPhone:
                        driver.mobileNumber ||
                        driver.phone ||
                        driver.user?.phoneNumber ||
                        "0000000000",
                    },
                  });
                  toast.success("Driver assigned successfully");
                  setShowAssignDriverModal(false);
                  setAssigningRoute(null);
                  fetchRoutes();
                } catch (err) {
                  toast.error("Failed to assign driver");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Route</label>
                <select
                  name="routeId"
                  defaultValue={assigningRoute?.id || ""}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Select route
                  </option>
                  {routesData.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route_no} · {route.bus_no}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Driver</label>
                <select
                  name="driverId"
                  defaultValue={drivers.find(d => d.user?._id === assigningRoute?.driver_profile_id)?.id || ""}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Select bus driver
                  </option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.user?.firstName} {driver.user?.lastName} · {driver.employeeId}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}
      {showMaintenanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowMaintenanceModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Schedule Fleet Maintenance</h2>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const bus = fd.get("bus") as string;
                const service = fd.get("service") as string;
                const date = fd.get("date") as string;

                toast.success(
                  `Fleet maintenance scheduled successfully for ${bus} (${service}) on ${date}!`,
                );
                setShowMaintenanceModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Select Vehicle</label>
                <select
                  name="bus"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {fleet.map((f) => (
                    <option key={f.id}>
                      {f.busNo} ({f.driver})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Service Type</label>
                <select
                  name="service"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option>Engine Tuning & Oil Change</option>
                  <option>Brake Pad Replacement</option>
                  <option>AC Servicing</option>
                  <option>PUC Inspection Renewal</option>
                  <option>Tire Rotation & Alignment</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Scheduled Date</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue="2026-06-10"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Instructions / Comments</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Additional inspection details..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Schedule Service
              </button>
            </form>
          </div>
        </div>
      )}

      {showGeofenceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowGeofenceModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Define New Geofence Region</h2>
              <button
                onClick={() => setShowGeofenceModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get("name") as string;
                const radius = Number(fd.get("radius"));
                const trigger = fd.get("trigger") as string;
                const alertParent = fd.get("alertParent") === "true";

                setGeofences((prev) => [
                  ...prev,
                  {
                    id: genId(),
                    name,
                    radius,
                    trigger,
                    alertParent,
                    active: true,
                  },
                ]);

                toast.success(`Geofence region '${name}' registered with radius ${radius}m.`);
                setShowGeofenceModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Region Name / Identifier</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. South Entry Gate"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Radius Limit (meters)</label>
                <select
                  name="radius"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="50">50 meters</option>
                  <option value="100">100 meters</option>
                  <option value="200">200 meters</option>
                  <option value="500">500 meters</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Trigger Event Threshold</label>
                <select
                  name="trigger"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="enter">On Enter Boundary</option>
                  <option value="exit">On Exit Boundary</option>
                  <option value="both">On Both Enter & Exit</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border">
                <label className="text-xs font-semibold">Alert Wardens/Parents instantly</label>
                <select
                  name="alertParent"
                  className="h-8 rounded border border-border bg-background text-xs"
                >
                  <option value="true">Yes, Send Alerts</option>
                  <option value="false">No, Admin Log Only</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Establish Geofence
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
