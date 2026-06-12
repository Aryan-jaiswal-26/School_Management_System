import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, Eye, X, Users, Loader2, User, UploadCloud, ArrowLeft } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { apiClient, API_BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({ meta: [{ title: "Staff · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [viewStaff, setViewStaff] = useState<any | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient("/employees");
      const data = res?.data !== undefined ? res.data : res;
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const depts = [...new Set(staff.map((s) => s.department).filter(Boolean))].sort();
  const filtered = staff.filter((s) => {
    const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.toLowerCase();
    const m1 = fullName.includes(search.toLowerCase());
    const m2 = deptFilter === "all" || s.department === deptFilter;
    return m1 && m2;
  });

  if (showAdd) {
    return (
      <AddStaffForm onClose={() => setShowAdd(false)} onRefresh={fetchStaff} />
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff Directory"
        subtitle={loading ? "Loading staff..." : `${staff.length} staff members`}
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="all">All Departments</option>
          {depts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden md:block">
        <Panel title={`${filtered.length} staff`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Department</th>
                <th className="pb-3 pr-4">Attendance</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filtered.map((s) => (
                <tr key={s._id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 font-medium">{s.user?.firstName} {s.user?.lastName}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.designation}</td>
                  <td className="py-3 pr-4">{s.department || "N/A"}</td>
                  <td className="py-3 pr-4">
                    <span className="text-[oklch(0.45_0.15_155)]">100%</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                    >
                      {s.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setViewStaff(s)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={Users}
              title="No staff found"
              description="Adjust search or filters."
            />
          )}
        </Panel>
      </div>
      <div className="md:hidden space-y-3">
        {filtered.map((s) => (
          <div
            key={s._id}
            onClick={() => setViewStaff(s)}
            className="rounded-xl border border-border bg-card p-4 shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{s.user?.firstName} {s.user?.lastName}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
              >
                {s.isActive ? "active" : "inactive"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {s.designation} · {s.department || "N/A"} · 100%
            </div>
          </div>
        ))}
      </div>

      {viewStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewStaff(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Staff Profile</h2>
              <button
                onClick={() => setViewStaff(null)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Name", `${viewStaff.user?.firstName} ${viewStaff.user?.lastName}`],
                ["Role", viewStaff.designation],
                ["Department", viewStaff.department || "N/A"],
                ["Email", viewStaff.user?.email || "N/A"],
                ["Phone", viewStaff.phone || "N/A"],
                ["Join Date", new Date(viewStaff.joiningDate).toLocaleDateString()],
                ["Salary", `₹${(viewStaff.basicSalary || 0).toLocaleString()}`],
                ["Status", viewStaff.isActive ? "Active" : "Inactive"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{l}</div>
                  <div className="mt-1 font-medium">{v as React.ReactNode}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toIsoDate(value: string | null | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day, 12, 0, 0).toISOString();
  }
  return new Date(trimmed).toISOString();
}

interface FileUploaderProps {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

function FileUploader({
  label,
  required = false,
  file,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const validateAndSetFile = (f: File) => {
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error(`File size exceeds the limit of ${maxSizeMB}MB`);
      return;
    }
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    const allowedExts = accept.split(",").map((e) => e.trim().toLowerCase());
    if (!allowedExts.includes(ext) && !allowedExts.some((allowed) => f.type.match(allowed.replace("*", ".*")))) {
      toast.error(`Invalid file type. Allowed formats: ${accept}`);
      return;
    }
    onChange(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {!file ? (
        <label
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer text-center bg-card hover:bg-muted/50 hover:border-accent ${
            dragActive ? "border-accent bg-accent/10 scale-[1.01]" : "border-border"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-xs font-medium text-foreground">Drag & drop or click to upload</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Supports PDF, JPG, PNG (Max {maxSizeMB}MB)</span>
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="flex items-center gap-3 border border-border rounded-xl p-3 bg-card shadow-sm">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-border" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{file.name.split(".").pop()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface MultipleFileUploaderProps {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
}

function MultipleFileUploader({
  label,
  files,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 10,
}: MultipleFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const validateAndAddFiles = (fileList: FileList) => {
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        toast.error(`File ${f.name} exceeds the limit of ${maxSizeMB}MB`);
        continue;
      }
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      const allowedExts = accept.split(",").map((e) => e.trim().toLowerCase());
      if (!allowedExts.includes(ext) && !allowedExts.some((allowed) => f.type.match(allowed.replace("*", ".*")))) {
        toast.error(`File ${f.name} has invalid format.`);
        continue;
      }
      validFiles.push(f);
    }
    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <label
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer text-center bg-card hover:bg-muted/50 hover:border-accent ${
          dragActive ? "border-accent bg-accent/10 scale-[1.01]" : "border-border"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs font-medium text-foreground">Drag & drop or click to upload multiple files</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">Supports PDF, JPG, PNG (Max {maxSizeMB}MB each)</span>
        <input type="file" multiple accept={accept} onChange={handleFileChange} className="hidden" />
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            const previewUrl = isImage ? URL.createObjectURL(file) : null;
            return (
              <div key={idx} className="flex items-center gap-2 border border-border rounded-lg p-2 bg-card text-xs">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="h-8 w-8 rounded object-cover border border-border" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center border border-border text-[8px] font-bold text-muted-foreground uppercase">
                    {file.name.split(".").pop()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ProfilePhotoUploaderProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

function ProfilePhotoUploader({ file, onChange }: ProfilePhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!f.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPG/PNG)");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Profile photo must be less than 10MB");
        return;
      }
      onChange(f);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPG/PNG)");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("Profile photo must be less than 10MB");
        return;
      }
      onChange(f);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile Photo</label>
      <label
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative group h-24 w-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 bg-card hover:bg-muted/50 ${
          dragActive ? "border-accent bg-accent/10" : "border-border"
        }`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-medium transition-all">
              <UploadCloud className="h-4 w-4 mb-0.5" />
              <span>Change Photo</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <User className="h-8 w-8 text-muted-foreground" />
            <span className="text-[8px] font-bold text-muted-foreground mt-1 uppercase">Upload</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </label>
      {file && (
        <button type="button" onClick={() => onChange(null)} className="text-[10px] text-red-500 hover:underline">
          Remove Photo
        </button>
      )}
    </div>
  );
}

function AddStaffForm({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [employeeType, setEmployeeType] = useState<"TEACHING" | "NON_TEACHING">("TEACHING");
  const [emailVal, setEmailVal] = useState("");
  const [draft, setDraft] = useState<any>({});

  // File Upload states
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [leavingFile, setLeavingFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [experienceFile, setExperienceFile] = useState<File | null>(null);
  const [joiningFile, setJoiningFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

  const DRAFT_KEY = "school_erp_add_staff_draft";

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
          apiClient<any>("/academics/classes?page=1&limit=100"),
          apiClient<any>("/academics/sections?page=1&limit=100"),
          apiClient<any>("/academics/subjects"),
        ]);

        const classList = (classesRes?.data ?? classesRes ?? []).filter(Boolean);
        const sectionList = (sectionsRes?.data ?? sectionsRes ?? []).filter(Boolean);
        const subjectList = (subjectsRes?.data ?? subjectsRes ?? []).filter(Boolean);

        setClasses(classList);
        setSections(sectionList);
        setSubjects(subjectList);
      } catch (error) {
        console.error("Failed to load reference data", error);
      }
    };

    loadReferenceData();
    loadDraft();
  }, []);

  useEffect(() => {
    if (draft.employeeType) {
      setEmployeeType(draft.employeeType);
    }
  }, [draft.employeeType]);

  const saveDraft = (formEl: HTMLFormElement) => {
    const fd = new FormData(formEl);
    const draftData: Record<string, any> = {};
    fd.forEach((value, key) => {
      if (key !== "password" && key !== "confirmPassword" && !(value instanceof File)) {
        draftData[key] = value;
      }
    });
    draftData.selectedClassIds = selectedClassIds;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    toast.success("Draft saved successfully");
  };

  const loadDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setDraft(data);
      if (data.email) {
        setEmailVal(data.email);
      }
      if (data.selectedClassIds) {
        setSelectedClassIds(data.selectedClassIds);
      }
      toast.success("Draft loaded");
    } catch (err) {
      console.error("Failed to load draft", err);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const isStd11Or12Selected = selectedClassIds.some((classId) => {
    const cls = classes.find((c) => c._id === classId);
    if (!cls) return false;
    const name = cls.name.toLowerCase();
    return name.includes("11") || name.includes("12") || name.includes("eleven") || name.includes("twelve");
  });

  const availableSubjects = selectedClassIds.length
    ? subjects.filter((subject) => {
        const classId = typeof subject.classId === "string" ? subject.classId : subject.classId?._id;
        return selectedClassIds.includes(classId);
      })
    : [];

  const uploadDoc = async (employeeId: string, file: File, type: "RESUME" | "ID_PROOF" | "CONTRACT" | "OTHER") => {
    const form = new FormData();
    form.append("document", file);
    form.append("documentType", type);

    const headers: Record<string, string> = {};
    const savedImpersonation = localStorage.getItem("super_admin_impersonation");
    if (savedImpersonation) {
      try {
        const session = JSON.parse(savedImpersonation);
        if (session && session.schoolId) {
          headers["X-Tenant-ID"] = session.schoolId;
        }
      } catch (_) {}
    }
    const currentBranchId = localStorage.getItem("currentBranchId");
    if (currentBranchId) {
      headers["X-Branch-ID"] = currentBranchId;
    }

    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/documents`, {
      method: "POST",
      credentials: "include",
      headers,
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = "Failed to upload document";
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.message || msg;
      } catch (_) {}
      throw new Error(`${msg} (${file.name})`);
    }

    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    // Validations
    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirmPassword") as string;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!aadhaarFile) {
      toast.error("Aadhaar Card is required");
      return;
    }
    if (!degreeFile) {
      toast.error("Degree Certificate is required");
      return;
    }
    if (!leavingFile) {
      toast.error("Leaving / Relieving Certificate is required");
      return;
    }
    if (!idProofFile) {
      toast.error("Identity Proof is required");
      return;
    }

    setLoading(true);
    setUploadStatus("Creating employee profile...");

    try {
      const payload = {
        employeeId: `EMP-${Date.now()}`,
        employeeType: employeeType,
        designation: fd.get("designation") as string,
        qualification: (fd.get("qualification") as string) || undefined,
        joiningDate: toIsoDate(fd.get("joiningDate") as string) || new Date().toISOString(),
        basicSalary: Number(fd.get("salary") || 0),
        gender: (fd.get("gender") as string) || undefined,
        dateOfBirth: toIsoDate(fd.get("dateOfBirth") as string),
        mobileNumber: (fd.get("mobileNumber") as string) || undefined,
        alternateMobileNumber: (fd.get("alternateMobileNumber") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        state: (fd.get("state") as string) || undefined,
        zipCode: (fd.get("zipCode") as string) || undefined,
        bloodGroup: (fd.get("bloodGroup") as string) || undefined,
        experience: Number(fd.get("experience") || 0),
        aadhaarNumber: (fd.get("aadhaarNumber") as string) || undefined,
        employmentStatus: (fd.get("employmentStatus") as string) || "ACTIVE",
        employmentType: (fd.get("employmentType") as string) || undefined,
        classAssignment: selectedClassIds,
        sectionAssignment: (fd.getAll("sectionAssignment") as string[]).filter(Boolean),
        streamAssignment: isStd11Or12Selected
          ? (fd.get("streamAssignment") as string || "").split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        subjects: (fd.getAll("subjectAssignment") as string[]).filter(Boolean),
        isClassTeacher: fd.get("isClassTeacher") === "on",
        user: {
          firstName: fd.get("firstName") as string,
          lastName: fd.get("lastName") as string,
          email: fd.get("email") as string,
          password: password,
          role: fd.get("role") as string,
        },
      };

      const created = await apiClient<any>("/employees", { method: "POST", data: payload });
      const createdId = created?._id || created?.id;
      if (!createdId) throw new Error("Failed to get created Employee ID");

      // Upload profile photo
      if (profilePhotoFile) {
        setUploadStatus("Uploading profile photo...");
        const uploadRes = await uploadDoc(createdId, profilePhotoFile, "OTHER");
        const docData = uploadRes?.data || uploadRes;
        if (docData?.fileUrl) {
          const baseUrl = API_BASE_URL.startsWith("http")
            ? new URL(API_BASE_URL).origin
            : window.location.origin;
          const absoluteProfilePhotoUrl = `${baseUrl}${docData.fileUrl}`;
          // Update profile photo url
          await apiClient(`/employees/${createdId}`, {
            method: "PATCH",
            data: { profilePhoto: absoluteProfilePhotoUrl },
          });
        }
      }

      // Upload required documents
      setUploadStatus("Uploading Aadhaar Card...");
      await uploadDoc(createdId, aadhaarFile, "ID_PROOF");

      setUploadStatus("Uploading Degree Certificate...");
      await uploadDoc(createdId, degreeFile, "OTHER");

      setUploadStatus("Uploading Leaving Certificate...");
      await uploadDoc(createdId, leavingFile, "OTHER");

      setUploadStatus("Uploading Identity Proof...");
      await uploadDoc(createdId, idProofFile, "ID_PROOF");

      // Upload optional documents
      if (experienceFile) {
        setUploadStatus("Uploading Experience Certificate...");
        await uploadDoc(createdId, experienceFile, "OTHER");
      }
      if (joiningFile) {
        setUploadStatus("Uploading Joining Letter...");
        await uploadDoc(createdId, joiningFile, "CONTRACT");
      }

      // Upload additional files
      if (additionalFiles.length > 0) {
        let count = 1;
        for (const file of additionalFiles) {
          setUploadStatus(`Uploading additional document ${count} of ${additionalFiles.length}...`);
          await uploadDoc(createdId, file, "OTHER");
          count++;
        }
      }

      toast.success("Staff member added successfully");
      clearDraft();
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Staff Member</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to onboard a new employee</p>
        </div>
      </div>

      <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Main 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Personal details */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                Personal Details
              </h2>

              <div className="flex justify-center py-2">
                <ProfilePhotoUploader file={profilePhotoFile} onChange={setProfilePhotoFile} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name *</label>
                  <input name="firstName" required defaultValue={draft.firstName || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name *</label>
                  <input name="lastName" required defaultValue={draft.lastName || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender *</label>
                  <select name="gender" required defaultValue={draft.gender || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent">
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth *</label>
                  <input name="dateOfBirth" type="date" required defaultValue={draft.dateOfBirth || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Number *</label>
                  <input name="mobileNumber" type="tel" required defaultValue={draft.mobileNumber || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alternate Mobile Number</label>
                  <input name="alternateMobileNumber" type="tel" defaultValue={draft.alternateMobileNumber || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={emailVal}
                    onChange={(e) => setEmailVal(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blood Group</label>
                  <input name="bloodGroup" placeholder="O+ / A-" defaultValue={draft.bloodGroup || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address *</label>
                <input name="address" required defaultValue={draft.address || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">City *</label>
                  <input name="city" required defaultValue={draft.city || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">State *</label>
                  <input name="state" required defaultValue={draft.state || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pin Code *</label>
                  <input name="zipCode" required defaultValue={draft.zipCode || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                Employment Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</label>
                  <input
                    readOnly
                    placeholder="Auto-Generated on Save"
                    className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm outline-none text-muted-foreground cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation *</label>
                  <input name="designation" required defaultValue={draft.designation || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Type *</label>
                  <select
                    name="employeeType"
                    required
                    value={employeeType}
                    onChange={(e) => setEmployeeType(e.target.value as "TEACHING" | "NON_TEACHING")}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  >
                    <option value="TEACHING">Teaching</option>
                    <option value="NON_TEACHING">Non-Teaching</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Type</label>
                  <select name="employmentType" defaultValue={draft.employmentType || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent">
                    <option value="">Select Type</option>
                    <option value="PERMANENT">Permanent</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="CONTRACT_BASIS">Contract Basis</option>
                    <option value="VISITING_FACULTY">Visiting Faculty</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joining Date *</label>
                  <input name="joiningDate" type="date" required defaultValue={draft.joiningDate || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Status</label>
                  <select name="employmentStatus" defaultValue={draft.employmentStatus || "ACTIVE"} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="RESIGNED">Resigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Salary</label>
                <input name="salary" type="number" min="0" placeholder="Basic salary amount" defaultValue={draft.salary || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
          </div>

          {/* Right Column: Academic assignment, Qualification, Documents upload, Security credentials */}
          <div className="space-y-6">
            {employeeType === "TEACHING" && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  Academic Assignment
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard / Class Assignment</label>
                    <div className="border border-border rounded-lg p-2 max-h-36 overflow-y-auto bg-background space-y-1">
                      {classes.map((cls) => (
                        <label key={cls._id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:bg-muted/30 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedClassIds.includes(cls._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClassIds([...selectedClassIds, cls._id]);
                              } else {
                                setSelectedClassIds(selectedClassIds.filter((id) => id !== cls._id));
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-accent"
                          />
                          {cls.name}
                        </label>
                      ))}
                      {classes.length === 0 && <span className="text-xs text-muted-foreground">No classes available</span>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section Assignment</label>
                    <div className="border border-border rounded-lg p-2 max-h-36 overflow-y-auto bg-background space-y-1">
                      {sections.map((sec) => (
                        <label key={sec._id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:bg-muted/30 p-1 rounded">
                          <input
                            type="checkbox"
                            name="sectionAssignment"
                            value={sec._id}
                            defaultChecked={draft.sectionAssignment?.includes(sec._id)}
                            className="rounded border-border text-primary focus:ring-accent"
                          />
                          {sec.name}
                        </label>
                      ))}
                      {sections.length === 0 && <span className="text-xs text-muted-foreground">No sections available</span>}
                    </div>
                  </div>
                </div>

                {isStd11Or12Selected && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stream Assignment (Std 11–12)</label>
                    <input
                      name="streamAssignment"
                      placeholder="e.g. Science, Commerce, Arts (comma separated)"
                      defaultValue={draft.streamAssignment || ""}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject Assignment (filtered by class)</label>
                  <div className="border border-border rounded-lg p-2 max-h-40 overflow-y-auto bg-background space-y-1">
                    {availableSubjects.map((sub) => (
                      <label key={sub._id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:bg-muted/30 p-1 rounded">
                        <input
                          type="checkbox"
                          name="subjectAssignment"
                          value={sub._id}
                          defaultChecked={draft.subjectAssignment?.includes(sub._id)}
                          className="rounded border-border text-primary focus:ring-accent"
                        />
                        <span>{sub.name} <span className="text-[10px] text-muted-foreground">({sub.classId?.name})</span></span>
                      </label>
                    ))}
                    {availableSubjects.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedClassIds.length ? "No subjects assigned to selected classes" : "Select standard/class first to load subjects"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      name="isClassTeacher"
                      defaultChecked={draft.isClassTeacher === "on" || draft.isClassTeacher === true}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-accent"
                    />
                    Mark as Class Teacher
                  </label>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {employeeType === "TEACHING" ? "4" : "3"}
                </span>
                Qualification
              </h2>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Highest Qualification *</label>
                <input name="qualification" required placeholder="e.g. M.Sc. B.Ed, MCA, B.Tech" defaultValue={draft.qualification || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Certification</label>
                <input name="additionalCert" placeholder="e.g. Oracle Certified, Microsoft Teaching Certificate" defaultValue={draft.additionalCert || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience (Years)</label>
                <input name="experience" type="number" min="0" placeholder="Years of experience" defaultValue={draft.experience || ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {employeeType === "TEACHING" ? "5" : "4"}
                </span>
                Documents Upload
              </h2>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-primary pl-2">Required Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploader label="Aadhaar Card" required file={aadhaarFile} onChange={setAadhaarFile} />
                  <FileUploader label="Degree Certificate" required file={degreeFile} onChange={setDegreeFile} />
                  <FileUploader label="Leaving / Relieving Certificate" required file={leavingFile} onChange={setLeavingFile} />
                  <FileUploader label="Identity Proof" required file={idProofFile} onChange={setIdProofFile} />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-muted-foreground pl-2">Optional Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploader label="Experience Certificate" file={experienceFile} onChange={setExperienceFile} />
                  <FileUploader label="Joining Letter" file={joiningFile} onChange={setJoiningFile} />
                </div>
                <div className="pt-2">
                  <MultipleFileUploader label="Additional Documents (Multiple Files)" files={additionalFiles} onChange={setAdditionalFiles} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {employeeType === "TEACHING" ? "6" : "5"}
                </span>
                Security Credentials
              </h2>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff Login Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={emailVal}
                  readOnly
                  placeholder="Syncs with Email Address above"
                  className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm outline-none cursor-not-allowed font-medium text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password *</label>
                  <input name="password" type="password" required placeholder="Min 6 characters" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password *</label>
                  <input name="confirmPassword" type="password" required placeholder="Confirm password" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Role</label>
                <select name="role" defaultValue={draft.role || "TEACHER"} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent">
                  <option value="TEACHER">Teacher</option>
                  <option value="ACCOUNTANT">Staff / Accountant</option>
                  <option value="DRIVER">Staff / Driver</option>
                  <option value="SCHOOL_ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById("add-staff-form") as HTMLFormElement;
              if (form) saveDraft(form);
            }}
            className="px-6 py-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? (uploadStatus || "Adding...") : "Add Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}
