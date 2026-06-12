import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { Plus, Search, BookMarked, Briefcase, Mail, Phone, MapPin, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/alumni")({
  component: AdminAlumniPage,
});

function AdminAlumniPage() {
  const [view, setView] = useState<"list" | "new">("list");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("all");

  const fetchStudents = async () => {
    try {
      const res = await apiClient<any>("/students?limit=2000");
      setStudents(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const fetchAlumni = async () => {
    try {
      const res = await apiClient<any>("/alumni");
      setAlumni(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load alumni records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAlumni();
  }, []);

  const [formData, setFormData] = useState({
    studentId: "",
    graduationYear: new Date().getFullYear(),
    currentOccupation: "",
    companyOrUniversity: "",
    linkedInProfile: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient("/alumni", { method: "POST", data: formData });
      toast.success("Alumni record created successfully");
      setView("list");
      setFormData({ studentId: "", graduationYear: new Date().getFullYear(), currentOccupation: "", companyOrUniversity: "", linkedInProfile: "", email: "", phone: "", address: "" });
      fetchAlumni();
    } catch (err: any) {
      toast.error(err.message || "Failed to create record");
    }
  };

  const filteredAlumni = alumni.filter(a => {
    const nameMatches = a.studentId?.userId ? 
      `${a.studentId.userId.firstName} ${a.studentId.userId.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const yearMatches = filterYear === "all" || a.graduationYear.toString() === filterYear;
    return nameMatches && yearMatches;
  });

  const years = Array.from(new Set(alumni.map(a => a.graduationYear))).sort().reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Directory"
        subtitle="Track graduated students and maintain an active alumni network."
        actions={
          view === "list" ? (
            <button
              onClick={() => setView("new")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Alumni
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )
        }
      />

      {view === "list" && (
        <Panel title="Alumni Network">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search alumni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Graduating Classes</option>
                {years.map(y => (
                  <option key={y} value={y.toString()}>Class of {y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">Loading alumni network...</div>
            ) : filteredAlumni.length === 0 ? (
              <div className="col-span-full p-8 text-center text-muted-foreground">No alumni records found.</div>
            ) : (
              filteredAlumni.map((a) => (
                <div key={a._id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-foreground text-base">
                        {a.studentId?.userId?.firstName} {a.studentId?.userId?.lastName}
                      </div>
                      <div className="text-xs text-primary font-bold">Class of {a.graduationYear}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mt-2">
                    {a.currentOccupation && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.currentOccupation} {a.companyOrUniversity ? `at ${a.companyOrUniversity}` : ""}</span>
                      </div>
                    )}
                    {a.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.email}</span>
                      </div>
                    )}
                    {a.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.phone}</span>
                      </div>
                    )}
                    {a.address && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      {view === "new" && (
        <Panel title="Register Alumni">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Former Student</label>
              <select
                required
                value={formData.studentId}
                onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Select Student...</option>
                {students.map(s => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.user?.firstName} {s.user?.lastName} (#{s.admissionNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Graduation Year</label>
                <input
                  type="number"
                  required
                  value={formData.graduationYear}
                  onChange={e => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Current Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer / Student"
                  value={formData.currentOccupation}
                  onChange={e => setFormData({ ...formData, currentOccupation: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Company or University</label>
              <input
                type="text"
                placeholder="e.g. Google / Stanford University"
                value={formData.companyOrUniversity}
                onChange={e => setFormData({ ...formData, companyOrUniversity: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">LinkedIn Profile (URL)</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedInProfile}
                onChange={e => setFormData({ ...formData, linkedInProfile: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Current City / Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setView("list")}
                className="rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Add Alumni Record
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
