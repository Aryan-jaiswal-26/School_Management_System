import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  FileText,
  UserCheck,
  UserPlus
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/admin/import")({
  head: () => ({ meta: [{ title: "Bulk Import · Campus OS" }] }),
  component: Page,
});

interface ImportResult {
  totalProcessed: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: Record<string, any>;
    error: string;
  }>;
}

function Page() {
  const [activeTab, setActiveTab] = useState<"students" | "staff">("students");
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: "students" | "staff") => {
    let csvContent = "";
    let filename = "";
    if (type === "students") {
      csvContent =
        "firstName,lastName,dateOfBirth,gender,email,rollNumber,admissionNumber,grade,section,parentEmail,bloodGroup,enrollmentDate,address\n" +
        "John,Doe,2010-05-15,MALE,john.doe@example.com,10,ADM_123456,10,A,parent@example.com,O+,2026-06-01,123 Main St\n" +
        "Sarah,Conner,2011-09-22,FEMALE,sarah.c@example.com,12,ADM_987654,10,B,parent.conner@example.com,A-,2026-06-02,456 Elm St";
      filename = "students_import_template.csv";
    } else {
      csvContent =
        "firstName,lastName,email,role,employeeType,designation,password,employeeId,qualification,basicSalary,gender,dateOfBirth,mobileNumber,address,city,state,zipCode,bloodGroup\n" +
        "Jane,Smith,jane.smith@example.com,TEACHER,TEACHING,Math Teacher,welcome123,EMP_001,M.Sc. Mathematics,50000,FEMALE,1985-08-20,9876543210,456 Oak Ave,New York,NY,10001,A+\n" +
        "Robert,Johnson,robert.j@example.com,ACCOUNTANT,NON_TEACHING,Finance Manager,welcome123,EMP_002,MBA Finance,65000,MALE,1980-04-12,9876543211,789 Maple Rd,New York,NY,10002,B+";
      filename = "staff_import_template.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type === "students" ? "Student" : "Staff"} CSV template downloaded!`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error("Please upload only CSV files (.csv)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error("Please upload only CSV files (.csv)");
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setImporting(true);
    setResult(null);
    const endpoint = activeTab === "students" ? "/import/students" : "/import/staff";

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Get tenant and branch headers
      const savedImpersonation = localStorage.getItem("super_admin_impersonation");
      let impersonatedSchoolId = null;
      if (savedImpersonation) {
        try {
          const session = JSON.parse(savedImpersonation);
          if (session && session.schoolId) {
            impersonatedSchoolId = session.schoolId;
          }
        } catch (_) {}
      }
      const currentBranchId = localStorage.getItem("currentBranchId");
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (impersonatedSchoolId) {
        headers["X-Tenant-ID"] = impersonatedSchoolId;
      }
      if (currentBranchId) {
        headers["X-Branch-ID"] = currentBranchId;
      }

      const response = await fetch(`${BASE_URL}/v1${endpoint}`, {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });

      const resJson = await response.json();

      if (response.ok) {
        const importData = resJson.data || resJson;
        setResult({
          totalProcessed: importData.totalProcessed || 0,
          imported: importData.imported || 0,
          failed: importData.failed || 0,
          errors: importData.errors || [],
        });

        if (importData.failed === 0) {
          toast.success(`Successfully imported all ${importData.imported} records!`);
        } else if (importData.imported > 0) {
          toast.warning(`Partially successful: ${importData.imported} records imported, ${importData.failed} failed.`);
        } else {
          toast.error(`Import failed: All ${importData.failed} rows had validation errors.`);
        }
      } else {
        throw new Error(resJson.message || "Failed to parse and upload CSV");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import Data"
        subtitle="Onboard students or staff members efficiently using CSV spreadsheet templates"
      />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("students");
            clearFile();
          }}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "students"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Import Students
        </button>
        <button
          onClick={() => {
            setActiveTab("staff");
            clearFile();
          }}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "staff"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Import Staff / Employees
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left instructions column */}
        <div className="space-y-6 lg:col-span-1">
          <Panel title="Instructions">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Follow these simple guidelines to make sure your spreadsheet rows are parsed successfully:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Files must be in standard comma-separated format (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.csv</code>).
                </li>
                <li>Ensure column headers are spelled exactly as shown in the template file.</li>
                <li>Dates should use the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">YYYY-MM-DD</code> format.</li>
                <li>Emails must be unique; rows with duplicate emails will trigger validation failures.</li>
              </ul>
            </div>
          </Panel>

          <Panel title="CSV Templates">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Download the sample CSV file containing all compatible headings and start editing in Excel or Google Sheets.
              </p>
              <button
                onClick={() => downloadTemplate(activeTab)}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary py-3 text-sm font-bold transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download {activeTab === "students" ? "Student" : "Staff"} Template
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Upload Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title={`Upload Workspace: ${activeTab === "students" ? "Students" : "Staff"}`}>
            <div className="space-y-6">
              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border bg-muted/20 hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv"
                />

                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <UploadCloud className="h-7 w-7" />
                </div>

                <h3 className="text-sm font-bold text-foreground">
                  Drag & Drop CSV File here
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse local folders
                </p>
                <p className="mt-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Supports .csv files up to 5MB
                </p>
              </div>

              {/* Selected file card */}
              {file && (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-2">
                {file && (
                  <button
                    onClick={clearFile}
                    disabled={importing}
                    className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-bold hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
                  >
                    Clear File
                  </button>
                )}
                <button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {importing ? "Processing CSV..." : "Start Import"}
                </button>
              </div>
            </div>
          </Panel>

          {/* Results Summary Dashboard */}
          {result && (
            <Panel title="Import Operations Report">
              <div className="space-y-6">
                {/* Visual metric summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border/80 bg-card p-4">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Total Rows Checked</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{result.totalProcessed}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="text-xs text-emerald-600/80 uppercase font-semibold">Success Count</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-600 flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6" /> {result.imported}
                    </div>
                  </div>
                  <div className={`rounded-xl border p-4 ${result.failed > 0 ? "border-rose-500/20 bg-rose-500/5" : "border-border/80 bg-card"}`}>
                    <div className={`text-xs uppercase font-semibold ${result.failed > 0 ? "text-rose-600/80" : "text-muted-foreground"}`}>Validation Failures</div>
                    <div className={`mt-1 text-2xl font-bold flex items-center gap-2 ${result.failed > 0 ? "text-rose-600" : "text-foreground"}`}>
                      {result.failed > 0 ? <XCircle className="h-6 w-6" /> : null} {result.failed}
                    </div>
                  </div>
                </div>

                {/* Error log details */}
                {result.failed > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 text-sm font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Detailed Failure Log ({result.failed} rows rejected)
                    </div>
                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                          <tr>
                            <th className="p-3">Record Details</th>
                            <th className="p-3">Rejected Cause</th>
                            <th className="p-3 hidden sm:table-cell">Raw Row Data Preview</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.errors.map((err, idx) => {
                            const name = `${err.row?.firstName || ""} ${err.row?.lastName || ""}`.trim();
                            const identifier = name || err.row?.email || `Row #${idx + 1}`;
                            return (
                              <tr key={idx} className="hover:bg-muted/20">
                                <td className="p-3 font-medium text-foreground">{identifier}</td>
                                <td className="p-3 text-rose-600 font-semibold">{err.error}</td>
                                <td className="p-3 text-xs text-muted-foreground font-mono truncate max-w-xs hidden sm:table-cell">
                                  {JSON.stringify(err.row)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.failed === 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-600 text-sm font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    All records were successfully parsed and imported into the database.
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
