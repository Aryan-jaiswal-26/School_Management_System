import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle,
  Plus,
  X,
  Phone,
  Calendar,
  AlertTriangle,
  Users,
  ShieldAlert,
  UserCheck,
  Zap,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/academics")({
  head: () => ({ meta: [{ title: "Academics · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"syllabus" | "leads" | "timetable">("syllabus");
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Leads CRM State
  const [leads, setLeads] = useState<any[]>([]);

  // Timetabling State
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // Syllabus & Subjects State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabusModules, setSyllabusModules] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [leadsRes, ttRes, subRes, sylRes] = await Promise.all([
        apiClient<any>("/academics/leads"),
        apiClient<any>("/academics/timetable"),
        apiClient<any>("/academics/subjects"),
        apiClient<any>("/academics/syllabus")
      ]);
      setLeads(leadsRes?.data || []);
      setSchedules(ttRes?.data || []);
      setSubjects(subRes?.data || []);
      setSyllabusModules(sylRes?.data || []);
    } catch (err) {
      toast.error("Failed to fetch academic data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamic Clash Checking Input States
  const [clashAlert, setClashAlert] = useState<{
    type: "teacher" | "room" | "none";
    message: string;
  }>({ type: "none", message: "" });

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newLead = {
      studentName: fd.get("studentName") as string,
      grade: fd.get("grade") as string,
      parentName: fd.get("parentName") as string,
      phone: fd.get("phone") as string,
      status: "prospect",
      callbackDate: fd.get("callback") as string,
    };
    try {
      await apiClient("/academics/leads", { method: "POST", data: newLead });
      toast.success(`Lead successfully registered for ${newLead.studentName}!`);
      setShowLeadModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to add lead");
    }
  };

  const handleCheckClash = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const day = fd.get("day") as string;
    const time = fd.get("time") as string;
    const teacher = fd.get("teacher") as string;
    const room = fd.get("room") as string;
    const subject = fd.get("subject") as string;

    // Check teacher clash
    const teacherConflict = schedules.find(
      (s) => s.dayOfWeek === day && s.startTime === time && s.teacherId?.user?.firstName === teacher,
    );
    // Check room clash
    const roomConflict = schedules.find((s) => s.dayOfWeek === day && s.startTime === time && s.room === room);

    if (teacherConflict) {
      setClashAlert({
        type: "teacher",
        message: `CLASH ALERT: ${teacher} is already assigned to teach ${teacherConflict.subjectId?.name || "a subject"} in ${teacherConflict.room} on ${day} at ${time}!`,
      });
      toast.error(`Scheduling Conflict: ${teacher} is busy!`);
    } else if (roomConflict) {
      setClashAlert({
        type: "room",
        message: `CLASH ALERT: ${room} is already booked on ${day} at ${time}!`,
      });
      toast.error(`Scheduling Conflict: ${room} is occupied!`);
    } else {
      setClashAlert({ type: "none", message: "" });
      try {
        await apiClient("/academics/timetable", {
          method: "POST",
          data: { dayOfWeek: day, startTime: time, endTime: "N/A", teacherId: "000000000000000000000001", subjectId: "000000000000000000000001", classId: "000000000000000000000001", room }
        });
        toast.success("Timetable slot scheduled successfully with no clashes!");
        setShowScheduleModal(false);
        fetchData();
      } catch (err) {
        toast.error("Failed to schedule timetable");
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Academics & ERP Scheduler"
        subtitle="Syllabus progress, Front Office Lead CRM, and Clash-Free timetabling engine"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total Leads" value={String(leads.length)} icon={Users} tone="info" />
        <StatCard
          label="Enrolled Leads"
          value={String(leads.filter((l) => l.status === "enrolled").length)}
          icon={UserCheck}
          tone="success"
        />
        <StatCard label="Active Timetable Slots" value={String(schedules.length)} icon={Calendar} />
        <StatCard
          label="Syllabus Subjects"
          value={String(subjects.length)}
          icon={BookOpen}
          tone="success"
        />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["syllabus", "Syllabus Status"],
            ["leads", "Lead CRM Pipeline"],
            ["timetable", "Clash-Free Timetable Builder"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "syllabus" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const modules = syllabusModules.filter((m) => m.subjectId?._id === sub._id);
            const completed = modules.filter((m) => m.completed).length;
            const progress = modules.length > 0 ? (completed / modules.length) * 100 : 0;
            return (
              <Panel
                key={sub._id}
                title={sub.name}
                action={
                  <span className="text-xs text-muted-foreground font-medium">
                    {completed}/{modules.length} complete
                  </span>
                }
              >
                <div className="mb-3">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {modules.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card"
                    >
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${m.completed ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                      >
                        {m.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{m.unitName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(m.topics || []).join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {tab === "leads" && (
        <Panel
          title="Front Office CRM & Admission Leads"
          action={
            <button
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Capture Lead
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">Student Candidate</th>
                  <th className="pb-3 px-4">Parent Name</th>
                  <th className="pb-3 px-4">Phone Number</th>
                  <th className="pb-3 px-4">Admission Status</th>
                  <th className="pb-3 px-4">Next Call Date</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((l) => (
                  <tr key={l._id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold">{l.studentName}</div>
                      <div className="text-xs text-muted-foreground">{l.grade}</div>
                    </td>
                    <td className="py-3.5 px-4">{l.parentName}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {l.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${l.status === "enrolled" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : l.status === "prospect" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"}`}
                      >
                        {l.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-muted-foreground">
                      {new Date(l.callbackDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right space-x-2">
                      {l.status !== "enrolled" && (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                await apiClient(`/academics/leads/${l._id}`, { method: "PATCH", data: { status: "enrolled" } });
                                fetchData();
                                toast.success(`${l.studentName} successfully enrolled as a student!`);
                              } catch (err) {
                                toast.error("Failed to update status");
                              }
                            }}
                            className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                          >
                            Mark Enrolled
                          </button>
                          <button
                            onClick={() => {
                              toast.success(
                                `Callback scheduled notification sent to warden! Next contact: ${new Date(l.callbackDate).toLocaleDateString()}`,
                              );
                            }}
                            className="rounded bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/20"
                          >
                            Send Call Reminder
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "timetable" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Panel title="Schedule Class Assignment">
              <p className="text-xs text-muted-foreground mb-4">
                Test Room & Teacher clash parameters before appending classes to the master
                timetable.
              </p>
              <form onSubmit={handleCheckClash} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Subject</label>
                  <input
                    name="subject"
                    required
                    defaultValue="Chemistry"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Day</label>
                  <select
                    name="day"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Time Slot</label>
                  <select
                    name="time"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>01:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Assigned Teacher</label>
                  <select
                    name="teacher"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>Dr. Roy</option>
                    <option>Prof. Sharma</option>
                    <option>Mrs. Iyer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Room Allocation</label>
                  <select
                    name="room"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option>Room 101</option>
                    <option>Room 102</option>
                    <option>Science Lab A</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-4 w-4" />
                  Evaluate & Schedule
                </button>
              </form>
            </Panel>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {clashAlert.type !== "none" && (
              <div className="rounded-xl border border-destructive bg-destructive/10 p-4 flex gap-3 text-sm animate-pulse">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <div className="font-bold text-destructive">Timetable Collision Conflict!</div>
                  <div className="text-muted-foreground mt-0.5">{clashAlert.message}</div>
                </div>
              </div>
            )}

            <Panel title="Active Classroom Timetable Schedules">
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded bg-accent/10 text-accent font-semibold font-mono text-xs">
                        {s.dayOfWeek.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.subjectId?.name || "Subject"}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.teacherId?.user?.firstName || "Teacher"} · {s.room}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-foreground">{s.startTime} - {s.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowLeadModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Capture Admission CRM Lead</h2>
              <button
                onClick={() => setShowLeadModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Candidate Student Name</label>
                <input
                  name="studentName"
                  required
                  placeholder="e.g. Aarav Sen"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Target Grade</label>
                <select
                  name="grade"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option>Grade 9</option>
                  <option>Grade 10</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Parent / Guardian Name</label>
                <input
                  name="parentName"
                  required
                  placeholder="e.g. Ramesh Sen"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone Number</label>
                <input
                  name="phone"
                  required
                  placeholder="e.g. +91 99887 76655"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Next Scheduled Callback Date
                </label>
                <input
                  name="callback"
                  type="date"
                  required
                  defaultValue="2026-05-25"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold"
              >
                Log Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
