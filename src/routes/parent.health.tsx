import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity, Shield, Bell, FileText, HeartPulse } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/parent/health")({
  head: () => ({ meta: [{ title: "Child Health & Wellness · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"profile" | "vaccinations" | "alerts" | "checkups">("profile");
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [activeChildName, setActiveChildName] = useState<string>("Student");
  const [profile, setProfile] = useState<any>(null);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [checkups, setCheckups] = useState<any[]>([]);

  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem("parent_active_child") || "";
      const name = localStorage.getItem("parent_active_child_name") || "Student";
      setActiveChildId(stored);
      setActiveChildName(name);
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const fetchData = async () => {
    if (!activeChildId) return;
    try {
      const [pRes, vRes, aRes, cRes] = await Promise.all([
        apiClient<any>(`/health/medical-profiles/me?studentId=${activeChildId}`),
        apiClient<any>(`/health/vaccinations/me?studentId=${activeChildId}`),
        apiClient<any>("/health/alerts"),
        apiClient<any>(`/health/checkups/me?studentId=${activeChildId}`),
      ]);
      setProfile(pRes?.data || pRes);
      setVaccinations(Array.isArray(vRes) ? vRes : vRes?.data || []);
      setAlerts(Array.isArray(aRes) ? aRes : aRes?.data || []);
      setCheckups(Array.isArray(cRes) ? cRes : cRes?.data || []);
    } catch (err) {
      toast.error("Failed to load health records");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeChildId]);

  const pendingVacs = vaccinations.filter((v) => v.status === "DUE");
  const recentAlerts = alerts.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child from the top bar to view health records.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Health & Wellness" subtitle="Track your child's health profile, vaccinations, and alerts" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard label="Allergies & Conditions" value={String((profile?.allergies?.length || 0) + (profile?.medicalConditions?.length || 0))} icon={HeartPulse} tone="info" />
        <StatCard label="Pending Vaccinations" value={String(pendingVacs.length)} icon={Shield} tone={pendingVacs.length > 0 ? "warning" : "success"} />
        <StatCard label="Recent Alerts" value={String(recentAlerts.length)} icon={Bell} tone={recentAlerts.length > 0 ? "destructive" : "success"} />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["profile", "Health Profile"],
            ["vaccinations", "Vaccinations"],
            ["checkups", "Annual Checkups"],
            ["alerts", "Alerts & Notifications"],
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

      {tab === "profile" && (
        <Panel title="Medical Profile">
          {profile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-3">General Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Blood Group:</span> {profile.bloodGroup || "Not specified"}</p>
                      <p><span className="text-muted-foreground">Insurance Provider:</span> {profile.insuranceProvider || "N/A"}</p>
                      <p><span className="text-muted-foreground">Policy Number:</span> {profile.insurancePolicyNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <h3 className="font-semibold mb-3">Emergency Contacts</h3>
                    {profile.emergencyContacts?.map((c: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0 text-sm">
                        <p className="font-medium">{c.name} <span className="text-muted-foreground">({c.relation})</span></p>
                        <p className="text-muted-foreground">{c.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                    <h3 className="font-semibold text-destructive mb-3">Allergies & Restrictions</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Allergies</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.allergies?.length > 0 ? profile.allergies.map((a: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-md font-medium">{a}</span>
                          )) : <span className="text-sm text-muted-foreground">None</span>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Dietary Restrictions</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.restrictedFoods?.length > 0 ? profile.restrictedFoods.map((f: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-warning/10 text-warning-foreground text-xs rounded-md font-medium">{f}</span>
                          )) : <span className="text-sm text-muted-foreground">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                    <h3 className="font-semibold text-accent-foreground mb-3">Medical Conditions</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {profile.medicalConditions?.length > 0 ? profile.medicalConditions.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      )) : <span className="text-muted-foreground">None reported</span>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="Profile unavailable" description="Medical profile has not been created." />
          )}
        </Panel>
      )}

      {tab === "vaccinations" && (
        <Panel title="Vaccination Records">
          <div className="space-y-4">
            {vaccinations.map((v) => (
              <div key={v._id} className="flex justify-between items-center rounded-lg border border-border p-4 bg-card">
                <div>
                  <h3 className="font-semibold text-base mb-1">{v.vaccineName}</h3>
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>Given: {new Date(v.dateAdministered).toLocaleDateString()}</span>
                    {v.nextDueDate && <span>Next Due: {new Date(v.nextDueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  v.status === 'VERIFIED' ? 'bg-success/10 text-success' : 
                  v.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 
                  'bg-warning/10 text-warning'
                }`}>
                  {v.status}
                </span>
              </div>
            ))}
            {vaccinations.length === 0 && (
              <EmptyState icon={Shield} title="No records" description="No vaccination records found for your child." />
            )}
          </div>
        </Panel>
      )}

      {tab === "alerts" && (
        <Panel title="Health Alerts & Notifications">
          <div className="space-y-4">
            {alerts.map((a) => (
              <div key={a._id} className={`rounded-lg border p-4 ${
                a.alertType === 'EMERGENCY' ? 'border-destructive/50 bg-destructive/5' : 
                a.alertType === 'ALLERGY' ? 'border-warning/50 bg-warning/5' : 
                'border-border'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{a.message}</p>
                <div className="mt-2 text-xs font-medium uppercase text-muted-foreground">
                  Type: {a.alertType}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <EmptyState icon={Bell} title="No alerts" description="You have no recent health alerts." />
            )}
          </div>
        </Panel>
      )}
      {tab === "checkups" && (
        <Panel title="Annual Health Checkups">
          <div className="space-y-4">
            {checkups.map((c) => (
              <div key={c._id} className="rounded-lg border border-border p-4">
                <h3 className="font-semibold">{c.year} Annual Checkup</h3>
                <p className="text-sm text-muted-foreground">Doctor: {c.doctorName} · Date: {new Date(c.date).toLocaleDateString()}</p>
              </div>
            ))}
            {checkups.length === 0 && (
              <EmptyState icon={FileText} title="No Checkup Records" description="Annual health clearance reports will appear here." />
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
