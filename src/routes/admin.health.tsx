import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Activity,
  Heart,
  Plus,
  Search,
  BellRing,
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  Thermometer,
  Send,
  User,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/health")({
  head: () => ({ meta: [{ title: "Infirmary & Health Suite · Campus OS" }] }),
  component: HealthSuitePage,
});

interface HealthProfile {
  id: string;
  studentId?: string;
  studentName: string;
  grade: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  vaccinationStatus: "Fully Vaccinated" | "Pending Doses" | "Exempt";
  emergencyContact: string;
  parentName: string;
}

interface ClinicLog {
  id: string;
  studentId?: string;
  studentName: string;
  grade: string;
  checkInTime: string;
  temperature: string;
  symptoms: string;
  treatment: string;
  status: "Resting in Infirmary" | "Discharged to Class" | "Sent Home with Parent";
  guardianNotified: boolean;
}

function HealthSuitePage() {
  const [tab, setTab] = useState<"cabinet" | "logs">("logs");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [healthProfiles, setHealthProfiles] = useState<HealthProfile[]>([]);
  const [clinicLogs, setClinicLogs] = useState<ClinicLog[]>([]);

  const fetchProfiles = async () => {
    try {
      const res = await apiClient<any>("/health/medical-profiles");
      const data = Array.isArray(res) ? res : res?.data || [];
      const mapped = data.map((p: any) => ({
        id: p._id || p.id,
        studentId: p.studentId?._id || p.studentId?.id || p.studentId || "",
        studentName: p.studentId?.userId ? `${p.studentId.userId.firstName} ${p.studentId.userId.lastName}`.trim() : "Unknown Student",
        grade: p.studentId?.rollNumber || p.studentId?.admissionNumber || "N/A",
        bloodGroup: p.bloodGroup || "N/A",
        allergies: Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies || "None",
        chronicConditions: Array.isArray(p.medicalConditions) ? p.medicalConditions.join(", ") : p.medicalConditions || "None",
        vaccinationStatus: "Fully Vaccinated" as const,
        emergencyContact: p.emergencyContacts?.[0]?.phone || "N/A",
        parentName: p.emergencyContacts?.[0]?.name || "N/A",
      }));
      setHealthProfiles(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVisits = async () => {
    try {
      const res = await apiClient<any>("/health/visits");
      const data = Array.isArray(res) ? res : res?.data || [];
      const mapped = data.map((v: any) => {
        let statusVal: ClinicLog["status"] = "Discharged to Class";
        if (v.severity === "HIGH") {
          statusVal = "Sent Home with Parent";
        } else if (v.severity === "MEDIUM") {
          statusVal = "Resting in Infirmary";
        }
        return {
          id: v._id || v.id,
          studentId: v.studentId?._id || v.studentId?.id || v.studentId || "",
          studentName: v.studentId?.userId ? `${v.studentId.userId.firstName} ${v.studentId.userId.lastName}`.trim() : "Unknown Student",
          grade: v.studentId?.rollNumber || v.studentId?.admissionNumber || "N/A",
          checkInTime: new Date(v.visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperature: v.temperature || "98.6 °F",
          symptoms: v.symptoms,
          treatment: v.treatment || "N/A",
          status: statusVal,
          guardianNotified: v.severity === "HIGH",
        };
      });
      setClinicLogs(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiClient<any>("/students?limit=200");
      setStudents(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchVisits();
    fetchStudents();
  }, []);

  // Handlers
  const handleAddClinicLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const studentId = fd.get("studentId") as string;
    const symptoms = fd.get("symptoms") as string;
    const temp = fd.get("temperature") as string;
    const treatment = fd.get("treatment") as string;
    const status = fd.get("status") as string;

    const severity = status === "Sent Home with Parent" ? "HIGH" : status === "Resting in Infirmary" ? "MEDIUM" : "LOW";

    try {
      await apiClient("/health/visits", {
        method: "POST",
        data: {
          studentId,
          symptoms,
          temperature: temp || "98.6 °F",
          treatment,
          severity,
          visitDate: new Date(),
        }
      });
      toast.success("Clinic admission entry logged successfully!");
      fetchVisits();
      setShowLogModal(false);
    } catch (err) {
      toast.error("Failed to log clinic entry");
    }
  };

  const handleAddHealthProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const studentId = fd.get("studentId") as string;
    const bloodGroup = fd.get("bloodGroup") as string;
    const allergies = fd.get("allergies") as string;
    const chronic = fd.get("chronic") as string;
    const parentName = fd.get("parentName") as string;
    const emergencyContact = fd.get("emergencyContact") as string;

    try {
      await apiClient("/health/medical-profiles", {
        method: "POST",
        data: {
          studentId,
          bloodGroup,
          allergies: allergies ? allergies.split(",").map(s => s.trim()) : [],
          medicalConditions: chronic ? chronic.split(",").map(s => s.trim()) : [],
          emergencyContacts: [{
            name: parentName,
            relation: "Parent",
            phone: emergencyContact,
          }]
        }
      });
      toast.success("Student EHR Record registered successfully!");
      fetchProfiles();
      setShowProfileModal(false);
    } catch (err) {
      toast.error("Failed to register Student EHR");
    }
  };

  const triggerMedicalAlert = async (log: ClinicLog) => {
    try {
      await apiClient("/health/alerts", {
        method: "POST",
        data: {
          title: `Clinic Check-in: ${log.studentName}`,
          message: `${log.studentName} checked in to the clinic with symptoms: ${log.symptoms}. Temperature: ${log.temperature}. Action: ${log.treatment}.`,
          alertType: "EMERGENCY",
          targetStudentIds: [log.studentId],
        }
      });
      toast.success("Emergency notification dispatched to parent!");
      fetchVisits();
    } catch (err) {
      toast.error("Failed to send alert to parent");
    }
  };

  // Filters
  const filteredProfiles = healthProfiles.filter(
    (p) =>
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.allergies.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grade.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infirmary & Student Health ERP"
        subtitle="Manage student electronic health records, active vaccination schedules, daily clinic admissions, and parent emergency alarms"
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Clinic Admissions"
          value={String(clinicLogs.length)}
          icon={Activity}
          tone="info"
        />
        <StatCard
          label="Currently Resting in Infirmary"
          value={String(clinicLogs.filter((l) => l.status === "Resting in Infirmary").length)}
          icon={Stethoscope}
          tone="warning"
        />
        <StatCard
          label="Asthma / Chronic Alerts"
          value={String(healthProfiles.filter((p) => p.chronicConditions !== "None").length)}
          icon={Heart}
          tone="success"
        />
        <StatCard
          label="Medical Alerts Dispatched"
          value={String(clinicLogs.filter((l) => l.guardianNotified).length)}
          icon={BellRing}
          tone="success"
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 max-w-sm">
        {(
          [
            ["logs", "Clinic Admissions Log", Activity],
            ["cabinet", "Digital Health Cabinet", FileSpreadsheet],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all ${
              tab === k
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {l}
          </button>
        ))}
      </div>

      {/* TAB 1: Clinic Admissions Log */}
      {tab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel
              title="Daily Infirmary Check-Ins"
              action={
                <button
                  onClick={() => setShowLogModal(true)}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Patient Check-In
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 px-4">Checked In</th>
                      <th className="pb-3 px-4">Vitals & Symptoms</th>
                      <th className="pb-3 px-4">Treatment Administered</th>
                      <th className="pb-3 px-4">Admissions Status</th>
                      <th className="pb-3 pl-4 text-right">Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clinicLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 pr-4">
                          <div>
                            <span className="font-semibold text-foreground">{log.studentName}</span>
                            <div className="text-[10px] font-medium text-muted-foreground">
                              {log.grade}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {log.checkInTime}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium space-y-1">
                            <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 dark:bg-orange-950/40 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                              <Thermometer className="h-3 w-3" />
                              {log.temperature}
                            </span>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                              {log.symptoms}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                          {log.treatment}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              log.status === "Resting in Infirmary"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                                : log.status === "Discharged to Class"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            onClick={() => triggerMedicalAlert(log)}
                            className={`flex items-center gap-1 ml-auto rounded px-2.5 py-1 text-xs font-bold transition-all ${
                              log.guardianNotified
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            }`}
                          >
                            <Send className="h-3 w-3" />
                            {log.guardianNotified ? "Guardian Alerted" : "Alert Parent"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Panel title="Infirmary Medicine Stock Audit">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="font-bold text-foreground">Paracetamol 500mg</div>
                    <div className="text-muted-foreground text-[10px]">Restock required soon</div>
                  </div>
                  <span className="rounded bg-red-100 dark:bg-red-950/30 px-2 py-0.5 font-mono font-bold text-red-700 dark:text-red-300">
                    24 tablets
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="font-bold text-foreground">Oral Rehydration Salts (ORS)</div>
                    <div className="text-muted-foreground text-[10px]">Adequate levels</div>
                  </div>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    120 packets
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="font-bold text-foreground">Antihistamine Syrups</div>
                    <div className="text-muted-foreground text-[10px]">Adequate levels</div>
                  </div>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    15 bottles
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-foreground">EpiPen Injectors</div>
                    <div className="text-muted-foreground text-[10px]">
                      Critical emergency stock
                    </div>
                  </div>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    6 units
                  </span>
                </div>
              </div>
            </Panel>

            <Panel title="Emergency Contacts Protocol">
              <div className="text-xs space-y-3 text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <AlertOctagon className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  Primary Hospital Partner
                </div>
                <p>
                  <strong>St. Mary Healthcare Hospital</strong>
                  <br />
                  Emergency Direct Line: +91 99880 00108
                  <br />
                  Ambulance Dispatch: 102 / 108
                </p>
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 flex gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                  <span>
                    Emergency Gate Pass triggers are automatically created when student status is
                    marked as <strong>Sent Home with Parent</strong>.
                  </span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* TAB 2: Digital Health Cabinet (Student Health Profiles) */}
      {tab === "cabinet" && (
        <div className="space-y-6">
          <Panel
            title="Electronic Health Records Directory"
            action={
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Search by student, blood, allergy…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="rounded bg-accent/15 px-3 py-1 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-all"
                >
                  Create Student Health EHR
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase bg-muted/20">
                    <th className="py-3 px-4 rounded-tl-lg">Student Profile</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Drug/Food Allergies</th>
                    <th className="py-3 px-4">Chronic Illness Registry</th>
                    <th className="py-3 px-4">Immunization Status</th>
                    <th className="py-3 px-4">Parent/Guardian Name</th>
                    <th className="py-3 px-4 rounded-tr-lg text-right">Emergency Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors text-xs">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded bg-accent/10 text-[10px] font-bold text-accent">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <span>{p.studentName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({p.grade})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-red-100 dark:bg-red-950/40 px-2 py-0.5 font-bold font-mono text-red-700 dark:text-red-300">
                          {p.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-red-600 dark:text-red-400 font-semibold">
                        {p.allergies}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground italic font-medium">
                        {p.chronicConditions}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            p.vaccinationStatus === "Fully Vaccinated"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                          }`}
                        >
                          {p.vaccinationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">{p.parentName}</td>
                      <td className="py-3.5 px-4 font-mono text-right font-semibold text-muted-foreground">
                        {p.emergencyContact}
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8">
                        <EmptyState
                          icon={Search}
                          title="No student match"
                          description="Search query yielded zero digital health files."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Modal: New Clinic Admission */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowLogModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Infirmary Log Entry</h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <span>✕</span>
              </button>
            </div>
            <form onSubmit={handleAddClinicLog} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Student</label>
                <select
                  name="studentId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.userId ? `${s.userId.firstName} ${s.userId.lastName}`.trim() : "Student"} ({s.rollNumber || s.admissionNumber || "N/A"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Temperature</label>
                  <input
                    name="temperature"
                    placeholder="e.g. 100.2 °F"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Admission Status</label>
                  <select
                    name="status"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="Resting in Infirmary">Resting in Infirmary</option>
                    <option value="Discharged to Class">Discharged to Class</option>
                    <option value="Sent Home with Parent">Sent Home with Parent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Symptoms / Complaint</label>
                <textarea
                  name="symptoms"
                  required
                  placeholder="e.g. Complaining of dizziness, vomiting sensation"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Treatment / Action Taken</label>
                <textarea
                  name="treatment"
                  required
                  placeholder="e.g. Monitored for 30 mins, gave ORS water, asked to rest."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold"
              >
                Log Infirmary Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Health Profile EHR */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Student EHR Record</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <span>✕</span>
              </button>
            </div>
            <form onSubmit={handleAddHealthProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Student</label>
                <select
                  name="studentId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.userId ? `${s.userId.firstName} ${s.userId.lastName}`.trim() : "Student"} ({s.rollNumber || s.admissionNumber || "N/A"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="mb-1 block text-sm font-medium">Blood Type</label>
                  <input
                    name="bloodGroup"
                    required
                    placeholder="e.g. O+"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium">Allergies (if any)</label>
                  <input
                    name="allergies"
                    placeholder="e.g. Peanuts, Aspirin"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Chronic Conditions / General Note
                </label>
                <input
                  name="chronic"
                  placeholder="e.g. Mild Asthma, Diabetes, or None"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Parent/Guardian Name</label>
                  <input
                    name="parentName"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Emergency Mobile</label>
                  <input
                    name="emergencyContact"
                    required
                    placeholder="e.g. +91 99887 11223"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold"
              >
                Register Cabinet Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
