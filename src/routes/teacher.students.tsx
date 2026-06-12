import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { Users, Search, Loader2, Phone, Mail, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({ meta: [{ title: "My Students · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await apiClient<any>("/students?limit=100");
        setStudents(res?.data || []);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const classOptions = Array.from(new Set(students.map(s => `${s.classDetails?.name || ""}-${s.sectionDetails?.name || ""}`).filter(v => v !== "-")));

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    const className = `${s.classDetails?.name || ""}-${s.sectionDetails?.name || ""}`;
    const matchesSearch = fullName.includes(search.toLowerCase()) || (s.admissionNumber || "").includes(search);
    const matchesClass = selectedClass === "all" || className === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Students Directory" 
        subtitle="Comprehensive profiles, contact details, and records for students in your assigned classes." 
      />

      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission number..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent min-w-[150px]"
        >
          <option value="all">All My Classes</option>
          {classOptions.map(c => (
            <option key={c} value={c}>Class {c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading student profiles...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">No students found</div>
            <div className="text-xs text-muted-foreground mt-1 max-w-xs">
              Either there are no students assigned to you, or none match your search filters.
            </div>
          </div>
        ) : (
          filteredStudents.map((s) => {
            const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim();
            const initials = fullName.split(" ").map(n => n[0]).join("").substring(0, 2);
            return (
              <div key={s._id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-accent/50 transition-all group">
                <div className="bg-muted/50 p-4 flex flex-col items-center justify-center border-b border-border text-center relative">
                  {s.medicalConditions && (
                    <div className="absolute top-3 right-3 text-destructive" title="Medical Alert">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  )}
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-3 ring-4 ring-background">
                    {initials || "ST"}
                  </div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{fullName || "Unknown Student"}</h3>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                    Class {s.classDetails?.name}-{s.sectionDetails?.name} • #{s.admissionNumber}
                  </div>
                </div>
                <div className="p-4 space-y-3 bg-card">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-foreground" /> 
                    <span className="truncate">{s.parentDetails?.phone || "No phone listed"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-foreground" /> 
                    <span className="truncate">{s.user?.email || "No email listed"}</span>
                  </div>
                  <button className="w-full mt-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors text-foreground">
                    View Full Profile
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
