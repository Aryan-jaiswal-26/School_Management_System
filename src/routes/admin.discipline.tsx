import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { Plus, Search, AlertTriangle, User, Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/discipline")({
  component: AdminDisciplinePage,
});

function AdminDisciplinePage() {
  const [view, setView] = useState<"list" | "new">("list");
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const fetchStudents = async () => {
    try {
      const res = await apiClient<any>("/students?limit=100");
      setStudents(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  const fetchRecords = async () => {
    try {
      // Temporarily fetching from a single student or all? 
      // The discipline API `GET /student/:studentId` exists. 
      // But we need a global endpoint `GET /discipline` in the backend. 
      // I will add `GET /discipline` to the backend shortly. For now let's call it.
      const res = await apiClient<any>("/discipline");
      setRecords(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load discipline records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchRecords();
  }, []);

  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    description: "",
    severity: "LOW",
    incidentDate: format(new Date(), "yyyy-MM-dd"),
    status: "PENDING_REVIEW"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient("/discipline", { method: "POST", data: formData });
      toast.success("Discipline record created successfully");
      setView("list");
      setFormData({ studentId: "", title: "", description: "", severity: "LOW", incidentDate: format(new Date(), "yyyy-MM-dd"), status: "PENDING_REVIEW" });
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to create record");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient(`/discipline/${id}`, { method: "PUT", data: { status: newStatus } });
      toast.success("Status updated");
      fetchRecords();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const filteredRecords = records.filter(r => {
    const student = students.find(s => s._id === r.studentId || s.id === r.studentId);
    const matchesSearch = student ? 
      `${student.user?.firstName} ${student.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesSev = filterSeverity === "all" || r.severity === filterSeverity;
    return matchesSearch && matchesSev;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-600">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-600">MEDIUM</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discipline Records"
        subtitle="Manage and track student behavioral incidents and merits."
        actions={
          view === "list" ? (
            <button
              onClick={() => setView("new")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Log Incident
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
        <Panel title="Incident Directory">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Incident</th>
                    <th className="p-4 font-semibold">Severity</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading records...</td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No discipline records found.</td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const student = students.find(s => s._id === record.studentId || s.id === record.studentId);
                      return (
                        <tr key={record._id} className="hover:bg-muted/50">
                          <td className="p-4">
                            <div className="font-bold text-foreground">
                              {student ? `${student.user?.firstName} ${student.user?.lastName}` : "Unknown Student"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              #{student?.admissionNumber}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{record.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {record.description}
                            </div>
                          </td>
                          <td className="p-4">
                            {getSeverityBadge(record.severity)}
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-mono">{new Date(record.incidentDate).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4">
                            <select
                              value={record.status}
                              onChange={(e) => handleUpdateStatus(record._id, e.target.value)}
                              className={`rounded border px-2 py-1 text-xs font-bold outline-none ${
                                record.status === 'RESOLVED' ? 'border-green-500/20 bg-green-500/10 text-green-600' :
                                record.status === 'PENDING_REVIEW' ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' :
                                'border-blue-500/20 bg-blue-500/10 text-blue-600'
                              }`}
                            >
                              <option value="PENDING_REVIEW">Pending</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="APPEALED">Appealed</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            {/* Further actions can go here */}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {view === "new" && (
        <Panel title="Log New Incident">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Student</label>
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Date of Incident</label>
                <input
                  type="date"
                  required
                  value={formData.incidentDate}
                  onChange={e => setFormData({ ...formData, incidentDate: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Incident Title</label>
              <input
                type="text"
                required
                placeholder="E.g. Disruption in class, Cheating on test"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Detailed Description</label>
              <textarea
                required
                rows={4}
                placeholder="Provide details about what happened..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Severity</label>
                <select
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="LOW">Low (Warning)</option>
                  <option value="MEDIUM">Medium (Detention)</option>
                  <option value="HIGH">High (Suspension)</option>
                  <option value="CRITICAL">Critical (Expulsion/Serious)</option>
                </select>
              </div>
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
                Submit Record
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
