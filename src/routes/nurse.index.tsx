import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Stethoscope, Activity, FileText, AlertTriangle, Pill, Search } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/nurse/")({
  head: () => ({ meta: [{ title: "Nurse Portal · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"dashboard" | "visits" | "medications" | "incidents">("dashboard");
  const [dashboard, setDashboard] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [dRes, vRes, mRes, iRes] = await Promise.all([
        apiClient<any>("/health/dashboard"),
        apiClient<any>("/health/visits"),
        apiClient<any>("/health/medications"),
        apiClient<any>("/health/incidents"),
      ]);
      setDashboard(dRes?.data || dRes);
      setVisits(Array.isArray(vRes) ? vRes : vRes?.data || []);
      setMedications(Array.isArray(mRes) ? mRes : mRes?.data || []);
      setIncidents(Array.isArray(iRes) ? iRes : iRes?.data || []);
    } catch (err) {
      toast.error("Failed to load health data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingMedications = medications.filter(m => m.status === "ACTIVE");
  const openIncidents = incidents.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Nurse Portal" subtitle="Manage clinic visits, medications, and health incidents" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Today's Visits" value={String(dashboard?.recentVisits?.length || visits.length || 0)} icon={Stethoscope} tone="info" />
        <StatCard label="Active Medications" value={String(pendingMedications.length)} icon={Pill} tone="primary" />
        <StatCard label="Open Incidents" value={String(openIncidents.length)} icon={AlertTriangle} tone={openIncidents.length > 0 ? "warning" : "success"} />
        <StatCard label="Health Profiles" value={String(dashboard?.totalProfiles || 0)} icon={Activity} />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["dashboard", "Overview"],
            ["visits", "Clinic Visits"],
            ["medications", "Medications"],
            ["incidents", "Incidents"],
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

      {tab === "dashboard" && (
        <Panel title="Recent Activity Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                Latest Clinic Visits
              </h3>
              <div className="space-y-3">
                {visits.slice(0, 5).map((v) => (
                  <div key={v._id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">Student ID: {v.studentId}</span>
                      <span className="text-xs text-muted-foreground">{new Date(v.visitDate).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-muted-foreground">{v.symptoms}</p>
                  </div>
                ))}
                {visits.length === 0 && <p className="text-sm text-muted-foreground">No recent visits.</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Recent Alerts & Incidents
              </h3>
              <div className="space-y-3">
                {incidents.slice(0, 5).map((i) => (
                  <div key={i._id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{i.incidentType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${i.severity === 'HIGH' || i.severity === 'CRITICAL' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                        {i.severity}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{i.description}</p>
                  </div>
                ))}
                {incidents.length === 0 && <p className="text-sm text-muted-foreground">No recent incidents.</p>}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === "visits" && (
        <Panel title="Clinic Visit Logs">
          <div className="space-y-4">
            {visits.map((v) => (
              <div key={v._id} className="rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Student ID: {v.studentId}</h3>
                  <span className="text-sm text-muted-foreground">{new Date(v.visitDate).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="font-medium">Symptoms:</span>
                    <p className="text-muted-foreground mt-1">{v.symptoms}</p>
                  </div>
                  <div>
                    <span className="font-medium">Diagnosis & Treatment:</span>
                    <p className="text-muted-foreground mt-1">{v.diagnosis || "N/A"}</p>
                    <p className="text-muted-foreground">{v.treatment}</p>
                  </div>
                </div>
              </div>
            ))}
            {visits.length === 0 && (
              <EmptyState icon={Stethoscope} title="No visits logged" description="Clinic visit records will appear here." />
            )}
          </div>
        </Panel>
      )}

      {tab === "medications" && (
        <Panel title="Medication Tracking">
          <div className="space-y-4">
            {medications.map((m) => (
              <div key={m._id} className="rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{m.medicineName}</h3>
                  <p className="text-sm text-muted-foreground">Student ID: {m.studentId}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span><span className="font-medium">Dosage:</span> {m.dosage}</span>
                    <span><span className="font-medium">Schedule:</span> {m.schedule}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium mb-2 ${m.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {m.status}
                  </span>
                  <span className="text-xs text-muted-foreground">Started: {new Date(m.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {medications.length === 0 && (
              <EmptyState icon={Pill} title="No medication plans" description="Active medication tracking plans will appear here." />
            )}
          </div>
        </Panel>
      )}

      {tab === "incidents" && (
        <Panel title="Incident Reports">
          <div className="space-y-4">
            {incidents.map((i) => (
              <div key={i._id} className="rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{i.incidentType}</h3>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      i.severity === 'CRITICAL' || i.severity === 'HIGH' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    }`}>
                      {i.severity}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      i.status === 'RESOLVED' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                    }`}>
                      {i.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2 text-foreground">{i.description}</p>
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>Location: {i.location}</span>
                  <span>Date: {new Date(i.incidentDate).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <EmptyState icon={AlertTriangle} title="No incidents" description="No health incidents reported." />
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
