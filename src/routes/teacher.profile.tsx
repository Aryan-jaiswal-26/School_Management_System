import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Shield, Save, BookOpen, Clock } from "lucide-react";
import { useTeacherData } from "@/hooks/useTeacherData";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({ meta: [{ title: "My Profile · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { data: profile = {}, loading, error, retry } = useTeacherData(
    useCallback(() => {
      return user?.id ? apiClient<any>("/teachers/profile") : Promise.resolve({} as any);
    }, [user?.id])
  );

  // Initialize editable fields after profile loads
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Sync state when profile data arrives (must be before any early returns)
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-muted-foreground">Loading profile...</span></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <span className="text-destructive">Failed to load profile: {error.message}</span>
        <button onClick={retry} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Retry</button>
      </div>
    );
  }

  // Helper to send profile updates to backend
  const updateProfile = async (updates: Partial<any>) => {
    try {
      await apiClient("/teachers/profile", { method: "PATCH", data: updates });
      // Refresh data after successful update
      retry();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateProfile({ name, phone, bio });
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your teacher profile and credentials." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {user?.initials || "AI"}
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">{user?.name || "Anita Iyer"}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {user?.sub || "Mathematics · HOD"}
            </p>

            <div className="mt-6 pt-6 border-t border-border space-y-3 text-left text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground font-semibold text-xs rounded bg-muted px-2 py-0.5">
                  Staff ID: STF-289
                </span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          { (profile?.qualification || profile?.department || profile?.joiningDate) && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h4 className="font-semibold text-sm border-b border-border pb-2">
                Academic Qualifications
              </h4>
              <div className="space-y-3">
                {profile?.qualification && (
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Degrees</div>
                    <div className="text-sm font-semibold text-foreground">{profile.qualification}</div>
                  </div>
                )}
                {profile?.department && (
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Departments</div>
                    <div className="text-sm font-semibold text-foreground">{profile.department}</div>
                  </div>
                )}
                {profile?.joiningDate && (
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Joining Date</div>
                    <div className="text-sm font-semibold text-foreground">{new Date(profile.joiningDate).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Edit profile form */}
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Edit Profile Details">
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Teacher Biography
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </form>
          </Panel>

          {/* Schedule Summary panel */}
          { (profile?.classesTaught || profile?.weeklyLectures || profile?.workMode) && (
            <Panel title="Class Assignments & Hours">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {profile?.classesTaught && (
                  <div className="rounded-xl border border-border p-4 bg-muted/40">
                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-xs font-medium">Classes Taught</span>
                    </div>
                    <div className="text-base font-bold">{profile.classesTaught}</div>
                  </div>
                )}
                {profile?.weeklyLectures && (
                  <div className="rounded-xl border border-border p-4 bg-muted/40">
                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Weekly Lectures</span>
                    </div>
                    <div className="text-base font-bold">{profile.weeklyLectures}</div>
                  </div>
                )}
                {profile?.workMode && (
                  <div className="rounded-xl border border-border p-4 bg-muted/40">
                    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Work Mode</span>
                    </div>
                    <div className="text-base font-bold">{profile.workMode}</div>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
