import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bus, MapPin, Phone, Clock } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/student/transport")({ component: Page });

function Page() {
  const [myRoute, setMyRoute] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    apiClient<any>("/transport/routes")
      .then((res) => {
        const routes = res?.data || [];
        if (routes.length) setMyRoute(routes[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 2)), 500);
    return () => clearInterval(interval);
  }, []);

  if (!myRoute)
    return (
      <div>
        <PageHeader title="Bus Tracking" />
        <Panel title="No Route">
          <p className="text-sm text-muted-foreground">No bus route assigned.</p>
        </Panel>
      </div>
    );

  const currentStopIdx = Math.min(
    Math.floor(progress / (100 / myRoute.stops.length)),
    myRoute.stops.length - 1,
  );

  return (
    <div>
      <PageHeader title="Bus Tracking" subtitle={`Route ${myRoute.routeNumber || myRoute.routeNo || ""} · ${myRoute.vehicleNumber || myRoute.busNo || ""}`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="Live Route Map">
            <div className="relative h-72 rounded-lg bg-gradient-to-br from-[#1a2e5a]/10 to-accent/5 border border-border overflow-hidden">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, oklch(0.55 0.13 255) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              {(myRoute.stops || []).map((s: any, i: number) => {
                const stopCount = (myRoute.stops || []).length;
                const x = 10 + (i / Math.max(stopCount - 1, 1)) * 80;
                const y = 30 + Math.sin(i * 1.2) * 20;
                return (
                  <div key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                    <div
                      className={`flex flex-col items-center ${i === currentStopIdx ? "scale-110" : ""} transition-all`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${i <= currentStopIdx ? "bg-accent border-accent" : "bg-card border-border"}`}
                      />
                      <span className="text-[10px] font-medium mt-1 whitespace-nowrap">
                        {s.name || s.stopName}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{s.time || s.arrivalTime}</span>
                    </div>
                    {i < (myRoute.stops || []).length - 1 && (
                      <div className="absolute top-2 left-4 w-[calc(100%+40px)] h-0.5 bg-border" />
                    )}
                  </div>
                );
              })}
              <div
                className="absolute transition-all duration-500"
                style={{ left: `${10 + (progress / 100) * 80}%`, top: "20%" }}
              >
                <div className="flex items-center gap-1 rounded-lg bg-accent text-accent-foreground px-2 py-1 text-xs font-medium shadow-lg animate-bounce">
                  <Bus className="h-3.5 w-3.5" />
                  🚌
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Route Details">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-accent" />
                <span>
                  {myRoute.vehicleNumber || myRoute.busNo} · {myRoute.routeNumber || myRoute.routeNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <span>
                  {myRoute.driverName || myRoute.driver} · {myRoute.driverPhone || myRoute.phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span>ETA: ~{Math.max(1, Math.round((100 - progress) / 12))} min</span>
              </div>
            </div>
          </Panel>
          <Panel title="Stops">
            <div className="space-y-2">
              {myRoute.stops.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg p-2 ${i === currentStopIdx ? "bg-accent/10 border border-accent/30" : ""}`}
                >
                  <div
                    className={`h-3 w-3 rounded-full ${i <= currentStopIdx ? "bg-accent" : "bg-muted"}`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.time}</div>
                  </div>
                  {i === currentStopIdx && (
                    <span className="text-[10px] font-medium text-accent">Current</span>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
