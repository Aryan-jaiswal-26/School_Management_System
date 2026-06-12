import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { User, Bell, Save, ShieldCheck, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchParentProfile, fetchNotificationPreferences, updateNotificationPreferences } from "@/lib/parent-api";

export const Route = createFileRoute("/parent/profile")({
  head: () => ({ meta: [{ title: "Profile & Settings · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    busAlerts: true,
    examGrades: true,
    feeReminders: true,
    attendance: true,
    newsletters: false,
  });

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([fetchParentProfile(), fetchNotificationPreferences()])
      .then(([profileRes, prefRes]) => {
        setProfile(profileRes.status === "fulfilled" ? profileRes.value : null);
        if (prefRes.status === "fulfilled" && prefRes.value) {
          setPreferences((current) => ({
            ...current,
            busAlerts: prefRes.value.busAlerts ?? current.busAlerts,
            examGrades: prefRes.value.examGrades ?? current.examGrades,
            feeReminders: prefRes.value.feeReminders ?? current.feeReminders,
            attendance: prefRes.value.attendance ?? current.attendance,
            newsletters: prefRes.value.newsletters ?? current.newsletters,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    toast.success("Profile info is loaded from the backend.", { description: "Contact updates can be extended next." });
  };

  const toggleNotif = async (key: keyof typeof preferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(true);
    try {
      await updateNotificationPreferences(next);
      toast.success("Preferences updated");
    } catch (error) {
      console.error(error);
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading profile...
      </div>
    );
  }

  const user = profile?.user || {};
  const parent = profile?.parent || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & Settings" subtitle="Manage your emergency contact details and notification alerts." />

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        <button onClick={() => setActiveTab("profile")} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === "profile" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"}`}>
          <User className="h-4 w-4" /> Contact Information
        </button>
        <button onClick={() => setActiveTab("notifications")} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === "notifications" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"}`}>
          <Bell className="h-4 w-4" /> Notification Preferences
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
          <Panel title="Primary Guardian Details">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><User className="h-3 w-3" /> Full Name</label>
                  <input defaultValue={`${user.firstName || ""} ${user.lastName || ""}`.trim()} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Relationship</label>
                  <input defaultValue={parent.occupation || "Parent"} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><Phone className="h-3 w-3" /> Primary Phone</label>
                  <input type="tel" defaultValue={user.phone || parent.contactPrimary || ""} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><Mail className="h-3 w-3" /> Email Address</label>
                  <input type="email" defaultValue={user.email || ""} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Residential Address</label>
                <textarea rows={2} defaultValue={parent.address || ""} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
          <Panel title="Push & SMS Alerts Configuration">
            <div className="space-y-1">
              {[
                ["busAlerts", "Live Bus & Transport Alerts", "Receive push notifications when child boards/deboards or bus is 10 mins away."],
                ["examGrades", "Exam Results & Grades", "Instant SMS when a new report card is published."],
                ["feeReminders", "Fee Reminders", "Automated alerts before due date."],
                ["attendance", "Daily Attendance", "Get notified if child is marked Absent or Late."],
                ["newsletters", "School Newsletters", "Receive weekly promotional emails and event summaries."],
              ].map(([key, title, description]) => {
                const enabled = preferences[key as keyof typeof preferences];
                return (
                  <label key={key} className="flex items-center justify-between cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-accent transition-colors">
                    <div>
                      <div className="font-bold text-foreground text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleNotif(key as keyof typeof preferences)}
                      disabled={saving}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${enabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition duration-200 ease-in-out ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </label>
                );
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
