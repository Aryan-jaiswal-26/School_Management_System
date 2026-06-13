import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  BookOpen,
  Clock,
  Award,
  Briefcase,
  DollarSign,
  MapPin,
  FileText,
  CheckCircle
} from "lucide-react";
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
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Sync state when profile data arrives
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setAlternateMobileNumber(profile.alternateMobileNumber || "");
      setGender(profile.gender || "");
      if (profile.dateOfBirth) {
        const d = new Date(profile.dateOfBirth);
        if (!isNaN(d.getTime())) {
          setDateOfBirth(d.toISOString().split("T")[0]);
        } else {
          setDateOfBirth("");
        }
      } else {
        setDateOfBirth("");
      }
      setBloodGroup(profile.bloodGroup || "");
      setAddress(profile.address || "");
      setCity(profile.city || "");
      setStateValue(profile.state || "");
      setZipCode(profile.zipCode || "");
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <span className="text-destructive">Failed to load profile: {error.message}</span>
        <button
          onClick={retry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const updateProfile = async (updates: Partial<any>) => {
    try {
      await apiClient("/teachers/profile", { method: "PATCH", data: updates });
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
    updateProfile({
      name,
      phone,
      bio,
      alternateMobileNumber,
      gender,
      dateOfBirth,
      bloodGroup,
      address,
      city,
      state: stateValue,
      zipCode,
    });
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
            <h3 className="mt-4 text-lg font-bold text-foreground">{name || user?.name || "Teacher"}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {profile.designation || "Faculty"}
            </p>

            <div className="mt-6 pt-6 border-t border-border space-y-3 text-left text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground font-semibold text-xs rounded bg-muted px-2 py-0.5">
                  Staff ID: {profile.employeeId || "N/A"}
                </span>
              </div>
              {profile.employmentStatus && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      profile.employmentStatus === "ACTIVE"
                        ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {profile.employmentStatus.toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Academic & Professional Info (Read-only) */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h4 className="font-semibold text-sm border-b border-border pb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Professional Details
            </h4>
            <div className="space-y-3">
              {profile.qualification && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Degrees / Qualification</div>
                  <div className="text-sm font-semibold text-foreground">{profile.qualification}</div>
                </div>
              )}
              {profile.department && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Department</div>
                  <div className="text-sm font-semibold text-foreground">{profile.department}</div>
                </div>
              )}
              {profile.joiningDate && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Joining Date</div>
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(profile.joiningDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {profile.experience !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Years of Experience</div>
                  <div className="text-sm font-semibold text-foreground">{profile.experience} years</div>
                </div>
              )}
              {profile.employmentType && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Employment Type</div>
                  <div className="text-sm font-semibold text-foreground">
                    {profile.employmentType.replace("_", " ")}
                  </div>
                </div>
              )}
              {profile.basicSalary !== undefined && profile.basicSalary > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Basic Salary</div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-0.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {profile.basicSalary.toLocaleString()}
                  </div>
                </div>
              )}
              {profile.aadhaarNumber && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Aadhaar Number</div>
                  <div className="text-sm font-semibold text-foreground">{profile.aadhaarNumber}</div>
                </div>
              )}
              {profile.isClassTeacher !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Is Class Teacher</div>
                  <div className="text-sm font-semibold text-foreground">
                    {profile.isClassTeacher ? "Yes" : "No"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit profile form & Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Edit Profile Details">
            <form onSubmit={handleSave} className="space-y-6 mt-2">
              {/* Section 1: Personal Details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Blood Group</label>
                    <input
                      type="text"
                      placeholder="e.g. O+, A-"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Section 2: Contact Details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Contact & Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      value={alternateMobileNumber}
                      onChange={(e) => setAlternateMobileNumber(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-foreground mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">State</label>
                    <input
                      type="text"
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Section 3: Biography */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Teacher Biography
                </h3>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none font-sans"
                  placeholder="Write a brief bio about your education, interests, or teaching background..."
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

          {/* Class Assignments Panel */}
          {((profile.classAssignment && profile.classAssignment.length > 0) ||
            (profile.sectionAssignment && profile.sectionAssignment.length > 0) ||
            (profile.subjects && profile.subjects.length > 0)) && (
            <Panel title="Class & Subject Assignments">
              <div className="space-y-4 py-2">
                {profile.classAssignment && profile.classAssignment.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mb-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Assigned Classes
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.classAssignment.map((c: any) => (
                        <span
                          key={c._id}
                          className="inline-flex items-center text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.sectionAssignment && profile.sectionAssignment.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mb-1.5">
                      <Shield className="h-3.5 w-3.5" /> Assigned Sections
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.sectionAssignment.map((s: any) => (
                        <span
                          key={s._id}
                          className="inline-flex items-center text-xs font-semibold rounded-lg bg-[oklch(0.65_0.15_155)]/10 text-[oklch(0.45_0.15_155)] border border-[oklch(0.65_0.15_155)]/20 px-2.5 py-1"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.subjects && profile.subjects.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mb-1.5">
                      <Clock className="h-3.5 w-3.5" /> Assigned Subjects
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.subjects.map((sub: any) => (
                        <span
                          key={sub._id}
                          className="inline-flex items-center text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1"
                        >
                          {sub.name} {sub.code ? `(${sub.code})` : ""}
                        </span>
                      ))}
                    </div>
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

