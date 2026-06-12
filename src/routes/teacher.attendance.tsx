import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Check, X as XIcon, Clock, Users, Loader2, Camera, QrCode, Volume2, Play } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/teacher/attendance")({ component: Page });

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch checkout sound
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (err) {
    console.error("Web Audio Beep failed", err);
  }
};

function Page() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"manual" | "qr">("manual");
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [clsRes, secRes] = await Promise.all([
          apiClient<any>("/academics/classes?limit=100"),
          apiClient<any>("/academics/sections?limit=100"),
        ]);
        const clsList = Array.isArray(clsRes) ? clsRes : clsRes?.data || [];
        const secList = Array.isArray(secRes) ? secRes : secRes?.data || [];
        setClasses(clsList);
        setSections(secList);
        
        if (clsList.length > 0) {
          setSelectedClassId(clsList[0]._id || clsList[0].id);
        }
      } catch (err) {
        toast.error("Failed to load metadata");
      }
    };
    fetchMetadata();
  }, []);

  const currentSections = sections.filter(
    s => s.classId === selectedClassId || (s.classId?._id && s.classId._id === selectedClassId)
  );

  useEffect(() => {
    if (currentSections.length > 0) {
      const stillValid = currentSections.some(s => (s._id || s.id) === selectedSectionId);
      if (!stillValid) {
        setSelectedSectionId(currentSections[0]._id || currentSections[0].id);
      }
    } else {
      setSelectedSectionId("");
    }
  }, [selectedClassId, sections]);

  useEffect(() => {
    if (!selectedClassId || !selectedSectionId) {
      setStudents([]);
      return;
    }
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res: any = await apiClient(`/students?limit=100&classId=${selectedClassId}&sectionId=${selectedSectionId}`);
        setStudents(res?.data || []);
      } catch (err) {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId, selectedSectionId]);

  const classStudents = students;

  const [records, setRecords] = useState<Record<string, "present" | "absent" | "exemption">>({});

  // Load existing attendance for today and ensure all students have a status (default to "present")
  useEffect(() => {
    const loadExisting = async () => {
      const today = new Date().toISOString().split("T")[0];
      const updates: Record<string, "present" | "absent" | "exemption"> = {};
      await Promise.all(
        classStudents.map(async (s) => {
          try {
            const res: any = await apiClient(`/attendance/student/${s._id}`);
            const history = res?.data || [];
            const todayRec = history.find((r: any) => r.session_date === today);
            if (todayRec) {
              const statusStr = todayRec.status.toLowerCase();
              if (statusStr === "exemption" || statusStr === "half_day" || statusStr === "leave") {
                updates[s._id] = "exemption";
              } else if (statusStr === "absent") {
                updates[s._id] = "absent";
              } else {
                updates[s._id] = "present";
              }
            } else {
              updates[s._id] = "present";
            }
          } catch (e) {
            updates[s._id] = "present";
          }
        })
      );
      setRecords(updates);
    };
    if (classStudents.length > 0) {
      loadExisting();
    }
  }, [classStudents]);



  const handleSubmit = async () => {
    try {
      setSaving(true);
      const activeClass = classes.find(c => (c._id || c.id) === selectedClassId);
      const activeSection = sections.find(s => (s._id || s.id) === selectedSectionId);
      const grade = activeClass ? activeClass.name.replace('Grade ', '') : "10";
      const section = activeSection ? activeSection.name : "A";

      const payload = classStudents.map((s) => ({
        session_date: new Date().toISOString().split("T")[0],
        grade,
        section,
        student_id: s._id,
        student_name: `${s.user?.firstName} ${s.user?.lastName}`,
        status: records[s._id] || "present",
      }));
      await apiClient("/attendance/bulk", { method: "POST", data: payload });
      toast.success("Attendance saved!", { description: `Attendance recorded.` });
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const present = Object.values(records).filter((v) => v === "present").length;
  const absent = Object.values(records).filter((v) => v === "absent").length;
  const exemption = Object.values(records).filter((v) => v === "exemption").length;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily class attendance" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Present" value={String(present)} icon={Check} tone="success" />
        <StatCard label="Absent" value={String(absent)} icon={XIcon} tone="warning" />
        <StatCard
          label="Exemption"
          value={String(exemption)}
          icon={Clock}
        />
        <StatCard label="Total" value={String(classStudents.length)} icon={Users} tone="info" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Class / Grade</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">-- Select Class --</option>
            {classes.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Section / Division</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={!selectedClassId}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">-- Select Section --</option>
            {currentSections.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setAttendanceMode("manual")}
          className={`flex items-center gap-2 pb-2 px-4 text-sm font-semibold transition-all border-b-2 ${
            attendanceMode === "manual" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Manual Roll Call
        </button>
        <button
          onClick={() => setAttendanceMode("qr")}
          className={`flex items-center gap-2 pb-2 px-4 text-sm font-semibold transition-all border-b-2 ${
            attendanceMode === "qr" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="h-4 w-4" />
          QR & ID Card Scan Kiosk
        </button>
      </div>

      {attendanceMode === "manual" ? (
        <Panel
          title={`Roll Call — ${classes.find(c => (c._id || c.id) === selectedClassId)?.name || ""} Section ${sections.find(s => (s._id || s.id) === selectedSectionId)?.name || ""}`}
          action={
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              Save
            </button>
          }
        >
          <div className="space-y-2">
            {classStudents.map((s) => {
              const fullName = `${s.user?.firstName} ${s.user?.lastName}`;
              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                      {fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{fullName}</div>
                      <div className="text-xs text-muted-foreground">Roll #{s.rollNumber || s.admissionNumber}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(["present", "absent", "exemption"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setRecords((p) => ({ ...p, [s._id]: status }))}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${records[s._id] === status ? (status === "present" ? "bg-[oklch(0.65_0.15_155)] text-white" : status === "absent" ? "bg-destructive text-white" : "bg-accent text-white") : "border border-border hover:bg-muted"}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {classStudents.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No students found.
              </div>
            )}
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Simulated Scanner View */}
          <div className="lg:col-span-2">
            <Panel
              title="ID Scan Camera Broadcast"
              action={
                <span className="flex items-center gap-1.5 text-xs text-[oklch(0.45_0.15_155)] font-bold uppercase animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.15_155)]" />
                  Kiosk Ready
                </span>
              }
            >
              <div className="relative h-80 rounded-2xl bg-black border border-border overflow-hidden flex flex-col items-center justify-center">
                {/* Visual scanner radar line */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_10px_#10b981] animate-bounce" style={{ animationDuration: "3s" }} />

                {/* Simulated static scan target brackets */}
                <div className="absolute h-48 w-48 border-2 border-emerald-500/40 rounded-3xl flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <span className="h-4 w-4 border-t-2 border-l-2 border-emerald-500" />
                    <span className="h-4 w-4 border-t-2 border-r-2 border-emerald-500" />
                  </div>
                  <div className="flex justify-between">
                    <span className="h-4 w-4 border-b-2 border-l-2 border-emerald-500" />
                    <span className="h-4 w-4 border-b-2 border-r-2 border-emerald-500" />
                  </div>
                </div>

                {/* Text prompt */}
                <div className="z-10 text-center space-y-2 px-4">
                  <Camera className="h-10 w-10 text-emerald-500 mx-auto animate-pulse" />
                  <p className="text-sm font-medium text-white">Position Student RFID Badge or QR Code inside boundaries</p>
                  <p className="text-[10px] text-zinc-400">Audio feedback will sound immediately upon identification</p>
                </div>
              </div>

              {/* Simulation inputs for testing scan swipes */}
              <div className="mt-4 p-4 rounded-xl border border-border bg-muted/20">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Simulate Barcode Sweep (Test Tool)</label>
                <div className="flex gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const stud = classStudents.find((s) => s._id === id);
                      if (stud) {
                        playBeep();
                        setRecords((p) => ({ ...p, [id]: "present" }));
                        const name = `${stud.user?.firstName} ${stud.user?.lastName}`;
                        setRecentScans((prev) => [{ id, name, time: new Date().toLocaleTimeString(), rollNo: stud.rollNumber || stud.admissionNumber }, ...prev].slice(0, 10));
                        toast.success(`Check-In: ${name} marked Present!`);
                      }
                      e.target.value = "";
                    }}
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none"
                  >
                    <option value="">-- Choose student to simulate scan swipe --</option>
                    {classStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.user?.firstName} {s.user?.lastName} (Roll #{s.rollNumber || s.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Panel>
          </div>

          {/* Recent Scans Feed */}
          <div>
            <Panel title="Recent Checked-In Logs">
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {recentScans.map((scan, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-card/65 shadow-sm animate-in slide-in-from-top duration-300">
                    <div>
                      <div className="text-xs font-bold text-foreground">{scan.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Roll #{scan.rollNo} · Verified Boarding</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-500/10 text-[oklch(0.45_0.15_155)] border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                        PRESENT
                      </span>
                      <div className="text-[9px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {scan.time}
                      </div>
                    </div>
                  </div>
                ))}
                {recentScans.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground text-xs leading-normal">
                    <Volume2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50 animate-bounce" />
                    No RFID check-ins logged yet.<br />Use simulated sweep selector to log check-ins.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
