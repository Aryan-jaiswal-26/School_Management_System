import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { HeartPulse, Activity, Shield, FileText } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/student/health")({
  head: () => ({ meta: [{ title: "My Health · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"profile" | "vaccinations" | "certificates">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [checkups, setCheckups] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [pRes, vRes, cRes] = await Promise.all([
        apiClient<any>("/health/medical-profiles/me"), // implicitly routing to student's own profile
        apiClient<any>("/health/vaccinations/me"),
        apiClient<any>("/health/checkups/me"),
      ]);
      setProfile(pRes?.data || pRes);
      setVaccinations(Array.isArray(vRes) ? vRes : vRes?.data || []);
      setCheckups(Array.isArray(cRes) ? cRes : cRes?.data || []);
    } catch (err) {
      // endpoints might 404 if profile doesn't exist yet
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completedVacs = vaccinations.filter((v) => v.status === "COMPLETED" || v.status === "VERIFIED");

  return (
    <div>
      <PageHeader title="My Health Profile" subtitle="View your medical records and vaccination status" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard label="Blood Group" value={profile?.bloodGroup || "N/A"} icon={HeartPulse} tone="primary" />
        <StatCard label="Allergies" value={String(profile?.allergies?.length || 0)} icon={Activity} tone={(profile?.allergies?.length || 0) > 0 ? "warning" : "success"} />
        <StatCard label="Vaccinations" value={String(completedVacs.length)} icon={Shield} tone="info" />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["profile", "Medical Profile"],
            ["vaccinations", "Vaccinations"],
            ["certificates", "Annual Checkups"],
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
        <Panel title="Medical Profile Details">
          {profile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Info</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="font-medium text-foreground">Blood Group:</span> {profile.bloodGroup || "Not specified"}</p>
                    <p><span className="font-medium text-foreground">Insurance Provider:</span> {profile.insuranceProvider || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Emergency Contacts</h3>
                  <div className="space-y-2">
                    {profile.emergencyContacts?.map((c: any, idx: number) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between items-center">
                        <div>
                          <p className="font-medium">{c.name} <span className="text-muted-foreground font-normal">({c.relation})</span></p>
                          <p className="text-muted-foreground">{c.phone}</p>
                        </div>
                      </div>
                    ))}
                    {!profile.emergencyContacts?.length && <p className="text-sm text-muted-foreground">No emergency contacts listed.</p>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Conditions & Allergies</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Allergies</h4>
                    {profile.allergies?.length > 0 ? (
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {profile.allergies.map((a: string, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">None reported</p>
                    )}
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Medical Conditions</h4>
                    {profile.medicalConditions?.length > 0 ? (
                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {profile.medicalConditions.map((c: string, i: number) => <li key={i}>{c}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">None reported</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No Profile Found" description="Your medical profile has not been set up yet." />
          )}
        </Panel>
      )}

      {tab === "vaccinations" && (
        <Panel title="Vaccination History">
          <div className="space-y-4">
            {vaccinations.map((v) => (
              <div key={v._id} className="flex justify-between items-center rounded-lg border border-border p-4">
                <div>
                  <h3 className="font-semibold text-base mb-1">{v.vaccineName}</h3>
                  <p className="text-sm text-muted-foreground">Administered: {new Date(v.dateAdministered).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.status === 'VERIFIED' ? 'bg-success/10 text-success' : v.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {v.status}
                </span>
              </div>
            ))}
            {vaccinations.length === 0 && (
              <EmptyState icon={Shield} title="No vaccinations" description="There are no vaccination records on file." />
            )}
          </div>
        </Panel>
      )}

      {tab === "certificates" && (
        <Panel title="Annual Health Checkups & Certificates">
          <div className="space-y-4">
            {checkups.map((c) => (
              <div key={c._id || c.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">Annual Health Clearance</h3>
                    <p className="text-sm text-muted-foreground">Date: {new Date(c.checkupDate).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">
                    PASSED
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 p-3 rounded-lg text-xs">
                  <div>
                    <p className="text-muted-foreground font-medium">Height</p>
                    <p className="text-foreground font-bold">{c.height ? `${c.height} cm` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Weight</p>
                    <p className="text-foreground font-bold">{c.weight ? `${c.weight} kg` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">BMI</p>
                    <p className="text-foreground font-bold">{c.bmi || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Vision / Hearing</p>
                    <p className="text-foreground font-bold">{c.vision || "N/A"} / {c.hearing || "N/A"}</p>
                  </div>
                </div>
                {c.generalAssessment && (
                  <div className="text-sm border-t border-border/50 pt-2">
                    <p className="font-semibold text-foreground text-xs">General Assessment:</p>
                    <p className="text-muted-foreground mt-0.5">{c.generalAssessment}</p>
                  </div>
                )}
              </div>
            ))}
            {checkups.length === 0 && (
              <EmptyState icon={FileText} title="No records available" description="Annual health clearance checkup reports will appear here." />
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
