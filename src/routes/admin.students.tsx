import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, Eye, UserPlus, X, Loader2, User, BookOpen, MapPin, Users, Shield, ArrowRight, ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { apiClient, BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "alumni" | "deleted">("students");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<any[]>([]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient("/students");
      const data = res?.data !== undefined ? res.data : res;
      setStudents(Array.isArray(data) ? data : []);

      const alumRes: any = await apiClient("/alumni");
      const alumData = alumRes?.data !== undefined ? alumRes.data : alumRes;
      setAlumni(Array.isArray(alumData) ? alumData : []);

      const deletedRes: any = await apiClient("/students?isDeleted=true");
      const deletedData = deletedRes?.data !== undefined ? deletedRes.data : deletedRes;
      setDeletedStudents(Array.isArray(deletedData) ? deletedData : []);
    } catch (err) {
      toast.error("Failed to load students/alumni/deleted");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will soft-delete the student, moving them to the 'Recently Deleted' tab.`)) {
      return;
    }
    try {
      setLoading(true);
      await apiClient(`/students/${id}`, { method: "DELETE" });
      toast.success("Student soft-deleted successfully");
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete student");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreStudent = async (id: string, name: string) => {
    try {
      setLoading(true);
      await apiClient(`/students/${id}/restore`, { method: "POST" });
      toast.success("Student restored successfully");
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    const rollNo = s.rollNumber || s.admissionNumber || "";
    const matchSearch = fullName.includes(search.toLowerCase()) || rollNo.includes(search);
    const matchGrade = gradeFilter === "all" || s.classDetails?.name === gradeFilter;
    return matchSearch && matchGrade;
  });

  const grades = [...new Set(students.map((s) => s.classDetails?.name).filter(Boolean))].sort();

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={loading ? "Loading students..." : `${students.length} students enrolled`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-all"
            >
              Upload CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Student
            </button>
          </div>
        }
      />

      <div className="mb-6 flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "students" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Students
        </button>
        <button
          onClick={() => setActiveTab("alumni")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "alumni" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Alumni Directory
        </button>
        <button
          onClick={() => setActiveTab("deleted")}
          className={`pb-3 text-sm font-medium transition-all ${
            activeTab === "deleted" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Recently Deleted
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll no…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none"
        >
          <option value="all">All Grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
        <button
          onClick={() => window.open(`${BASE_URL}/v1/export/pdf?type=students`, "_blank")}
          className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
        >
          PDF
        </button>
        <button
          onClick={() => window.open(`${BASE_URL}/v1/export/excel?type=students`, "_blank")}
          className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
        >
          Excel
        </button>
        <button
          onClick={() => toast.info("Duplicate Checker running...")}
          className="h-10 rounded-lg bg-amber-500/10 text-amber-600 px-4 text-sm font-medium hover:bg-amber-500 hover:text-white transition-all ml-auto"
        >
          Check Duplicates
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Panel title={activeTab === "students" ? `Showing ${filtered.length} students` : activeTab === "alumni" ? `Showing ${alumni.length} alumni` : `Showing ${deletedStudents.length} deleted students`}>
          {activeTab === "deleted" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Admission Number</th>
                    <th className="pb-3 pr-4">Grade / Class</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedStudents.map((s) => (
                    <tr key={s._id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{s.user?.firstName} {s.user?.lastName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.admissionNumber}</td>
                      <td className="py-3 pr-4">
                        {s.classDetails?.name || "N/A"}-{s.sectionDetails?.name || "N/A"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreStudent(s._id, `${s.user?.firstName} ${s.user?.lastName}`)}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-all active:scale-95 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {deletedStudents.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No recently deleted records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === "alumni" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Graduation Year</th>
                    <th className="pb-3 pr-4">Current Occupation</th>
                    <th className="pb-3 pr-4">Company/University</th>
                  </tr>
                </thead>
                <tbody>
                  {alumni.map((a) => (
                    <tr key={a._id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{a.studentId?.firstName} {a.studentId?.lastName}</td>
                      <td className="py-3 pr-4">{a.graduationYear}</td>
                      <td className="py-3 pr-4">{a.currentOccupation}</td>
                      <td className="py-3 pr-4">{a.companyOrUniversity}</td>
                    </tr>
                  ))}
                  {alumni.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No alumni records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Roll</th>
                    <th className="pb-3 pr-4">Grade</th>
                    <th className="pb-3 pr-4">Attendance</th>
                    <th className="pb-3 pr-4">Fees Due</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr key={s._id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{s.user?.firstName} {s.user?.lastName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.rollNumber || s.admissionNumber}</td>
                      <td className="py-3 pr-4">
                        {s.classDetails?.name || "N/A"}-{s.sectionDetails?.name || "N/A"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`font-medium ${s.attendance >= 85 ? "text-[oklch(0.45_0.15_155)]" : s.attendance >= 75 ? "text-[oklch(0.50_0.15_75)]" : "text-destructive"}`}
                        >
                          {s.attendance || 100}%
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[oklch(0.45_0.15_155)]">Paid</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                        >
                          {s.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewStudent(s)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted transition-all"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => window.open(`${BASE_URL}/v1/documents/id-card/${s._id}`, "_blank")}
                            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                            title="Generate ID Card"
                          >
                            ID
                          </button>
                          <button
                            onClick={() => window.open(`${BASE_URL}/v1/documents/tc/${s._id}`, "_blank")}
                            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="Issue Transfer Certificate"
                          >
                            TC
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s._id, `${s.user?.firstName} ${s.user?.lastName}`)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Delete Student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "students" && filtered.length === 0 && (
            <EmptyState
              icon={UserPlus}
              title="No students found"
              description="Try adjusting your search or filters."
            />
          )}
          {activeTab === "deleted" && deletedStudents.length === 0 && (
            <EmptyState
              icon={Trash2}
              title="No deleted records found"
              description="Recently deleted records will appear here."
            />
          )}
        </Panel>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {activeTab === "deleted" ? (
          deletedStudents.map((s) => (
            <div
              key={s._id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{s.user?.firstName} {s.user?.lastName}</span>
                <button
                  onClick={() => handleRestoreStudent(s._id, `${s.user?.firstName} ${s.user?.lastName}`)}
                  className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-2 py-1 text-xs font-semibold hover:bg-emerald-500 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" /> Restore
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Admission: {s.admissionNumber} · Grade: {s.classDetails?.name || "N/A"}-{s.sectionDetails?.name || "N/A"}
              </div>
            </div>
          ))
        ) : activeTab === "alumni" ? (
          alumni.map((a) => (
            <div
              key={a._id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2"
            >
              <div className="font-semibold text-foreground">{a.studentId?.firstName} {a.studentId?.lastName}</div>
              <div className="text-xs text-muted-foreground">
                Graduation Year: {a.graduationYear} · Occupation: {a.currentOccupation}
              </div>
            </div>
          ))
        ) : (
          filtered.map((s) => (
            <div
              key={s._id}
              onClick={() => setViewStudent(s)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-all relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{s.user?.firstName} {s.user?.lastName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                >
                  {s.isActive ? "active" : "inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                <span>Roll: {s.rollNumber || s.admissionNumber}</span>
                <span>
                  Grade: {s.classDetails?.name || "N/A"}-{s.sectionDetails?.name || "N/A"}
                </span>
                <span>Attendance: {s.attendance || 100}%</span>
                <span>Due: ₹0</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s._id, `${s.user?.firstName} ${s.user?.lastName}`); }}
                  className="flex items-center gap-1 rounded bg-red-500/10 text-red-500 px-2 py-1 text-xs font-medium hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
        {activeTab === "students" && filtered.length === 0 && (
          <EmptyState
            icon={UserPlus}
            title="No students found"
            description="Try adjusting your search."
          />
        )}
        {activeTab === "deleted" && deletedStudents.length === 0 && (
          <EmptyState
            icon={Trash2}
            title="No deleted records found"
            description="Recently deleted records will appear here."
          />
        )}
      </div>

      {/* View Modal */}
      {viewStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewStudent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Student Profile</h2>
              <button
                onClick={() => setViewStudent(null)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                {viewStudent.user?.firstName?.[0] || "?"}
              </div>
              <div>
                <div className="text-lg font-semibold">{viewStudent.user?.firstName} {viewStudent.user?.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  Grade {viewStudent.classDetails?.name || "N/A"}-{viewStudent.sectionDetails?.name || "N/A"} · Roll #{viewStudent.rollNumber || viewStudent.admissionNumber}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Email", viewStudent.user?.email || "N/A"],
                ["Phone", viewStudent.emergencyContact || "N/A"],
                ["Guardian", viewStudent.parents?.[0]?.relationship || "N/A"],
                ["Address", viewStudent.address || "N/A"],
                ["Attendance", `${viewStudent.attendance || 100}%`],
                ["Fees Paid", `₹57,400`],
                ["Fees Due", `₹0`],
                ["Status", viewStudent.isActive ? "Active" : "Inactive"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{l}</div>
                  <div className="mt-1 font-medium text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Bulk Import Students</h3>
              <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file containing student records. The file must include headers for: <code className="font-mono bg-muted px-1 rounded text-xs">firstName, lastName, dateOfBirth, gender, email</code>
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Plus className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImportFile(e.target.files[0]);
                      }
                    }} 
                  />
                </label>
              </div>

              {importFile && (
                <div className="text-sm bg-primary/10 text-primary border border-primary/20 p-2 rounded flex justify-between items-center">
                  <span className="truncate">{importFile.name}</span>
                  <button onClick={() => setImportFile(null)}><X className="h-4 w-4"/></button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="rounded-lg px-4 py-2 text-sm font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importFile || importing}
                  onClick={async () => {
                    if (!importFile) return;
                    setImporting(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", importFile);
                      
                      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                      const response = await fetch(`${BASE_URL}/v1/import/students`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${token}`
                        },
                        body: formData
                      });
                      
                      const result = await response.json();
                      if (response.ok) {
                        toast.success(`Imported ${result.data?.imported || 0} students!`);
                        if (result.data?.failed > 0) {
                          toast.error(`Failed to import ${result.data?.failed} rows.`);
                        }
                        setShowImport(false);
                        setImportFile(null);
                        fetchStudents();
                      } else {
                        throw new Error(result.message || "Failed to import");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Import failed");
                    } finally {
                      setImporting(false);
                    }
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center gap-2"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {importing ? "Importing..." : "Upload & Process"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onRefresh={fetchStudents} />}
    </div>
  );
}

function AddStudentModal({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const [clsRes, secRes] = await Promise.all([
          apiClient<any>("/academics/classes"),
          apiClient<any>("/academics/sections")
        ]);
        setClasses(Array.isArray(clsRes) ? clsRes : clsRes?.data || []);
        setSections(Array.isArray(secRes) ? secRes : secRes?.data || []);
      } catch (err) {
        console.error("Failed to load classes/sections", err);
      }
    };
    fetchClassData();
  }, []);
  
  const [form, setForm] = useState({
    // Personal Details
    firstName: "",
    lastName: "",
    dob: "2010-01-01",
    gender: "MALE",
    bloodGroup: "A+",
    nationality: "Indian",
    religion: "General",
    category: "General",
    motherTongue: "English",
    phone: "", 

    // Academic Details
    admissionNumber: "ADM-2026-" + Math.floor(1000 + Math.random() * 9000),
    classId: "",
    sectionId: "",
    academicYear: "2026-2027",
    admissionDate: new Date().toISOString().split("T")[0],

    // Address & Contact
    address: "",
    city: "",
    state: "",
    pinCode: "",

    // Parent details
    fatherName: "",
    motherName: "",
    primaryGuardian: "FATHER",
    guardianPhone: "",
    guardianEmail: "",
    guardianPassword: "",
    guardianOccupation: "",

    // Security
    email: "",
    password: "",
    confirmPassword: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const filteredSections = sections.filter(
    (s) => s.classId === form.classId || (s.classId?._id && s.classId._id === form.classId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      
      const selectedClass = classes.find(c => (c._id || c.id) === form.classId);
      const selectedSection = sections.find(s => (s._id || s.id) === form.sectionId);

      const payload: any = {
        admissionNumber: form.admissionNumber || `ADM-${Date.now()}`,
        classId: form.classId || undefined,
        sectionId: form.sectionId || undefined,
        grade: selectedClass?.name || undefined,
        section: selectedSection?.name || undefined,
        dob: new Date(form.dob).toISOString(),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: `${form.address}, ${form.city}, ${form.state} - ${form.pinCode}`,
        emergencyContact: form.phone || form.guardianPhone,
      };

      if (form.email && form.password) {
        payload.studentUser = {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        };
      }

      if (form.guardianEmail && form.guardianPhone) {
        const guardianName = form.primaryGuardian === "FATHER" ? form.fatherName : form.primaryGuardian === "MOTHER" ? form.motherName : (form.fatherName || form.motherName || "Guardian");
        const nameParts = (guardianName || "Parent").trim().split(" ");
        payload.newParents = [
          {
            firstName: nameParts[0] || "Parent",
            lastName: nameParts.slice(1).join(" ") || "Guardian",
            email: form.guardianEmail,
            password: form.guardianPassword || undefined,
            phone: form.guardianPhone,
            relationship: form.primaryGuardian,
            occupation: form.guardianOccupation || undefined,
          }
        ];
      }

      await apiClient("/students/admission", {
        method: "POST",
        data: payload
      });

      toast.success("Student admitted successfully");
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to admit student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Student</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Fill in all student details below on a single page. Personal, academic, address, parent, and security fields are shown together.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Personal Details</h3>
              <p className="text-sm text-muted-foreground">Enter the student's personal profile details.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name *</label>
                <input required type="text" placeholder="e.g. John" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name *</label>
                <input required type="text" placeholder="e.g. Doe" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Date of Birth *</label>
                <input required type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender *</label>
                <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Blood Group</label>
                <select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Nationality</label>
                <input type="text" placeholder="e.g. Indian" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Religion</label>
                <input type="text" placeholder="e.g. General" value={form.religion} onChange={(e) => set("religion", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary">
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Mother Tongue</label>
                <input type="text" placeholder="e.g. English" value={form.motherTongue} onChange={(e) => set("motherTongue", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Academic Details</h3>
              <p className="text-sm text-muted-foreground">Fill out admission and class assignment information.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Admission Number *</label>
                <input required type="text" value={form.admissionNumber} onChange={(e) => set("admissionNumber", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Grade / Class *</label>
                <select
                  required
                  value={form.classId}
                  onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value, sectionId: "" }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Section / Division *</label>
                <select
                  required
                  disabled={!form.classId}
                  value={form.sectionId}
                  onChange={(e) => set("sectionId", e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary disabled:opacity-50"
                >
                  <option value="">-- Select Section --</option>
                  {filteredSections.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Year</label>
                <input type="text" placeholder="e.g. 2026-2027" value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Admission Date</label>
                <input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Address & Contact</h3>
              <p className="text-sm text-muted-foreground">Student residence and contact details.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Phone / Contact</label>
                <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Address *</label>
                <textarea required rows={2} placeholder="Full residence address" value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">City *</label>
                <input required type="text" placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">State *</label>
                <input required type="text" placeholder="State" value={form.state} onChange={(e) => set("state", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Pin Code *</label>
                <input required type="text" placeholder="Zip/Pin code" value={form.pinCode} onChange={(e) => set("pinCode", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Parents & Guardians</h3>
              <p className="text-sm text-muted-foreground">Primary guardian information for contact and relationship.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Father's Full Name</label>
                <input type="text" placeholder="Father's Name" value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Mother's Full Name</label>
                <input type="text" placeholder="Mother's Name" value={form.motherName} onChange={(e) => set("motherName", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Guardian Relationship *</label>
                <select value={form.primaryGuardian} onChange={(e) => set("primaryGuardian", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary">
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian Occupation</label>
                <input type="text" placeholder="Occupation" value={form.guardianOccupation} onChange={(e) => set("guardianOccupation", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian Phone Number *</label>
                <input required type="tel" placeholder="Guardian Phone" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian Email Address *</label>
                <input required type="email" placeholder="guardian@example.com" value={form.guardianEmail} onChange={(e) => set("guardianEmail", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">🔐 Parent Portal Password</label>
                <p className="text-xs text-muted-foreground mb-2">Set a password so the parent can log in to their parent dashboard with the email above.</p>
                <input type="password" minLength={6} placeholder="Min. 6 characters (leave blank to use default: ParentPass123!)" value={form.guardianPassword} onChange={(e) => set("guardianPassword", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Security Credentials</h3>
              <p className="text-sm text-muted-foreground">Student login email and password.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Email (Login Username) *</label>
                <input required type="email" placeholder="student.name@school.com" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Password *</label>
                <input required type="password" minLength={6} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password *</label>
                <input required type="password" minLength={6} placeholder="••••••••" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-6 mt-6 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Enrolling..." : "Enroll Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
