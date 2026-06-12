import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { Plus, CalendarDays, Clock, MapPin, User } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/timetable")({
  component: AdminTimetablePage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultBreak = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  breakName: "Lunch Break",
  afterSlot: 3,
  duration: 60,
});

const defaultConfig = {
  classId: "",
  sectionId: "",
  academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
  startTime: "09:00",
  lectureDuration: 45,
  totalSlots: 6,
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  breaks: [defaultBreak()],
};

type BreakRow = {
  id: string;
  breakName: string;
  afterSlot: number;
  duration: number;
};

type PreviewRow = {
  id: string;
  dayOfWeek: string;
  type: "lecture" | "break";
  slotNumber?: number;
  breakName?: string;
  startTime: string;
  endTime: string;
};

type Assignment = {
  dayOfWeek: string;
  slotNumber: number;
  subjectId: string;
  teacherId: string;
  room: string;
};

function parseTime(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const ampm = match[3]?.toUpperCase();
  if (ampm) {
    if (hours === 12) {
      hours = ampm === "AM" ? 0 : 12;
    } else if (ampm === "PM") {
      hours += 12;
    }
  }
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function buildSchedule(startTime: string, lectureDuration: number, totalSlots: number, breaks: BreakRow[]) {
  const startMinutes = parseTime(startTime);
  const validBreaks = breaks
    .filter(b => b.breakName && b.duration > 0 && b.afterSlot >= 1 && b.afterSlot <= totalSlots)
    .sort((a, b) => a.afterSlot - b.afterSlot);

  const schedule: Omit<PreviewRow, 'dayOfWeek'>[] = [];
  let currentMinutes = startMinutes;

  for (let slotNumber = 1; slotNumber <= totalSlots; slotNumber += 1) {
    const slotStart = currentMinutes;
    const slotEnd = slotStart + lectureDuration;
    schedule.push({
      id: `lecture-${slotNumber}`,
      type: "lecture",
      slotNumber,
      startTime: formatTime(slotStart),
      endTime: formatTime(slotEnd),
    });
    currentMinutes = slotEnd;

    const matchingBreaks = validBreaks.filter(b => b.afterSlot === slotNumber);
    matchingBreaks.forEach(b => {
      const breakStart = currentMinutes;
      const breakEnd = breakStart + b.duration;
      schedule.push({
        id: `break-${slotNumber}-${b.id}`,
        type: "break",
        breakName: b.breakName,
        startTime: formatTime(breakStart),
        endTime: formatTime(breakEnd),
      });
      currentMinutes = breakEnd;
    });
  }

  return schedule;
}

function AdminTimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [config, setConfig] = useState(() => ({ ...defaultConfig }));
  const [templateDefaults, setTemplateDefaults] = useState<Record<number, Assignment>>({});
  const [slotAssignments, setSlotAssignments] = useState<Record<string, Assignment>>({});
  const [generatedSchedule, setGeneratedSchedule] = useState<PreviewRow[]>([]);
  const [savingTimetable, setSavingTimetable] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, secRes, subRes, tRes] = await Promise.all([
          apiClient<any>("/academics/classes"),
          apiClient<any>("/academics/sections"),
          apiClient<any>("/academics/subjects"),
          apiClient<any>("/employees?type=TEACHING"),
        ]);

        setClasses(Array.isArray(clsRes) ? clsRes : clsRes?.data || []);
        setSections(Array.isArray(secRes) ? secRes : secRes?.data || []);
        setSubjects(Array.isArray(subRes) ? subRes : subRes?.data || []);
        setTeachers(Array.isArray(tRes) ? tRes : tRes?.data || []);
      } catch (error) {
        toast.error("Failed to load timetable data");
      }
    };

    fetchData();
  }, []);

  const localSchedule = useMemo(() => {
    if (!config.startTime || config.totalSlots < 1 || config.lectureDuration < 1 || config.workingDays.length === 0) {
      return [] as PreviewRow[];
    }

    const baseSchedule = buildSchedule(
      config.startTime,
      config.lectureDuration,
      config.totalSlots,
      config.breaks
    );

    return config.workingDays.flatMap(day =>
      baseSchedule.map(slot => ({ ...slot, dayOfWeek: day }))
    );
  }, [config]);

  const previewSchedule = useMemo(() => {
    const baseSchedule = generatedSchedule.length > 0 ? generatedSchedule : localSchedule;
    if (baseSchedule.length === 0) return [];

    const uniqueSlotsMap = new Map<string, Omit<PreviewRow, "dayOfWeek">>();
    baseSchedule.forEach(item => {
      const key = `${item.startTime}-${item.endTime}`;
      if (!uniqueSlotsMap.has(key)) {
        uniqueSlotsMap.set(key, {
          id: item.id,
          type: item.type,
          slotNumber: item.slotNumber,
          breakName: item.breakName,
          startTime: item.startTime,
          endTime: item.endTime,
        });
      }
    });

    const uniqueSlots = Array.from(uniqueSlotsMap.values());

    return config.workingDays.flatMap(day =>
      uniqueSlots.map(slot => ({
        ...slot,
        dayOfWeek: day,
      }))
    );
  }, [generatedSchedule, localSchedule, config.workingDays]);

  const previewGrid = useMemo(() => {
    const timeKeys = Array.from(new Set(previewSchedule.map(item => `${item.startTime}-${item.endTime}`)));
    timeKeys.sort((a, b) => parseTime(a.split('-')[0]) - parseTime(b.split('-')[0]));

    return timeKeys.map(timeKey => {
      const [startTime, endTime] = timeKey.split('-');
      return {
        timeKey,
        startTime,
        endTime,
        items: config.workingDays.map(day =>
          previewSchedule.find(item => item.dayOfWeek === day && item.startTime === startTime && item.endTime === endTime)
        ),
      };
    });
  }, [previewSchedule, config.workingDays]);

  useEffect(() => {
    if (!config.classId) {
      setSlotAssignments({});
      setGeneratedSchedule([]);
      return;
    }

    let isMounted = true;

    const loadSavedTimetable = async () => {
      try {
        const url = config.sectionId 
          ? `/timetable/${config.classId}?sectionId=${config.sectionId}`
          : `/timetable/${config.classId}`;
        const res: any = await apiClient(url);
        const entries = Array.isArray(res) ? res : res?.data || [];
        
        if (!isMounted) return;

        if (entries.length > 0) {
          const workingDays = [...new Set(entries.map((e: any) => e.dayOfWeek))].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
          const startTimes = entries.map((e: any) => e.startTime).sort();
          const startTime = startTimes[0] || "09:00";
          
          const timeSlotsMap = new Map<string, string>();
          entries.forEach((e: any) => {
            timeSlotsMap.set(e.startTime, e.endTime);
          });
          const sortedStartTimes = Array.from(timeSlotsMap.keys()).sort((a, b) => parseTime(a) - parseTime(b));
          
          const reconstructedSchedule: PreviewRow[] = [];
          const reconstructedAssignments: Record<string, Assignment> = {};
          
          sortedStartTimes.forEach((time, index) => {
            const slotNumber = index + 1;
            const endTime = timeSlotsMap.get(time) || "";
            
            workingDays.forEach((day: any) => {
              reconstructedSchedule.push({
                id: `lecture-${slotNumber}`,
                dayOfWeek: day,
                type: "lecture",
                slotNumber,
                startTime: time,
                endTime,
              });
              
              const match = entries.find((e: any) => e.dayOfWeek === day && e.startTime === time);
              reconstructedAssignments[`${day}-${slotNumber}`] = {
                dayOfWeek: day,
                slotNumber,
                subjectId: match?.subjectId?._id || match?.subjectId || "",
                teacherId: match?.teacherId?._id || match?.teacherId || "",
                room: match?.room || "",
              };
            });
          });
          
          setConfig(prev => ({
            ...prev,
            startTime,
            totalSlots: sortedStartTimes.length,
            workingDays,
          }));
          setGeneratedSchedule(reconstructedSchedule);
          setSlotAssignments(reconstructedAssignments);
        } else {
          setGeneratedSchedule([]);
          setSlotAssignments({});
          setConfig(prev => ({
            ...prev,
            startTime: defaultConfig.startTime,
            lectureDuration: defaultConfig.lectureDuration,
            totalSlots: defaultConfig.totalSlots,
            workingDays: defaultConfig.workingDays,
            breaks: [defaultBreak()],
          }));
        }
      } catch (error) {
        if (!isMounted) return;
        setGeneratedSchedule([]);
        setSlotAssignments({});
      }
    };

    loadSavedTimetable();
    
    return () => {
      isMounted = false;
    };
  }, [config.classId, config.sectionId, sections]);

  useEffect(() => {
    const nextAssignments: Record<string, Assignment> = {};
    const activeSection = sections.find(s => (s._id || s.id) === config.sectionId);
    const defaultTeacherId = activeSection?.classTeacherId || "";

    previewSchedule.forEach(item => {
      if (item.type !== "lecture" || !item.slotNumber) return;
      const key = `${item.dayOfWeek}-${item.slotNumber}`;
      
      const existing = slotAssignments[key];
      nextAssignments[key] = {
        dayOfWeek: item.dayOfWeek,
        slotNumber: item.slotNumber,
        subjectId: existing?.subjectId || templateDefaults[item.slotNumber]?.subjectId || "",
        teacherId: existing?.teacherId || templateDefaults[item.slotNumber]?.teacherId || defaultTeacherId,
        room: existing?.room || templateDefaults[item.slotNumber]?.room || "",
      };
    });

    setSlotAssignments(nextAssignments);
  }, [previewSchedule, templateDefaults, config.sectionId, sections]);

  const handleAssignmentChange = (
    dayOfWeek: string,
    slotNumber: number,
    field: keyof Omit<Assignment, 'dayOfWeek' | 'slotNumber'>,
    value: string
  ) => {
    const key = `${dayOfWeek}-${slotNumber}`;
    setSlotAssignments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        dayOfWeek,
        slotNumber,
        [field]: value,
      },
    }));
  };

  const updateClassSection = (field: 'classId' | 'sectionId', value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!config.startTime || config.totalSlots < 1 || config.lectureDuration < 1 || config.workingDays.length === 0) {
      toast.error('Please complete timetable configuration before generating.');
      return;
    }

    setGenerating(true);
    try {
      const result = await apiClient('/timetable/generate', {
        method: 'POST',
        data: {
          startTime: config.startTime,
          lectureDuration: config.lectureDuration,
          totalSlots: config.totalSlots,
          workingDays: config.workingDays,
          breaks: config.breaks,
        },
      });
      const schedule = Array.isArray(result) ? result : result?.data || [];
      setGeneratedSchedule(schedule);
      toast.success('Timetable preview generated successfully.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTimetable = async () => {
    if (!config.classId) {
      toast.error('Please select a class.');
      return;
    }
    if (previewSchedule.length === 0) {
      toast.error('Generate your timetable preview first.');
      return;
    }

    setSavingTimetable(true);
    try {
      const assignments = Object.values(slotAssignments).map(item => ({
        dayOfWeek: item.dayOfWeek,
        slotNumber: item.slotNumber,
        subjectId: item.subjectId,
        teacherId: item.teacherId || undefined,
        room: item.room || undefined,
      }));

      await apiClient('/timetable/save', {
        method: 'POST',
        data: {
          classId: config.classId,
          sectionId: config.sectionId || undefined,
          academicYear: config.academicYear,
          startTime: config.startTime,
          lectureDuration: config.lectureDuration,
          totalSlots: config.totalSlots,
          workingDays: config.workingDays,
          breaks: config.breaks,
          assignments,
        },
      });
      toast.success('Timetable saved successfully.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save timetable');
    } finally {
      setSavingTimetable(false);
    }
  };

  const currentSections = sections.filter(
    s => s.classId === config.classId || (s.classId?._id && s.classId._id === config.classId)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Builder"
        subtitle="Configure lecture slots, breaks, and live preview for class schedules."
      />

      <div className="space-y-6">
        <Panel title="Timetable Configuration">
          <div className="space-y-4">

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Class / Grade</label>
                <select
                  value={config.classId}
                  onChange={e => updateClassSection('classId', e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Section</label>
                <select
                  value={config.sectionId}
                  onChange={e => updateClassSection('sectionId', e.target.value)}
                  disabled={!config.classId}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">-- Optional --</option>
                  {currentSections.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
                {config.sectionId && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const activeSec = sections.find(s => (s._id || s.id) === config.sectionId);
                      if (activeSec?.classTeacherId) {
                        const teacher = teachers.find(t => t._id === activeSec.classTeacherId);
                        const name = teacher
                          ? `${teacher.user?.firstName || teacher.userId?.firstName || ""} ${teacher.user?.lastName || teacher.userId?.lastName || ""}`.trim()
                          : "";
                        return name ? `Class Teacher: ${name}` : "Class Teacher: Assigned";
                      }
                      return "No Class Teacher assigned to this section.";
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Start Time</label>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={e => setConfig(prev => ({ ...prev, startTime: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Slot Count</label>
                <input
                  type="number"
                  min={1}
                  value={config.totalSlots}
                  onChange={e => setConfig(prev => ({ ...prev, totalSlots: Number(e.target.value) }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={config.lectureDuration}
                  onChange={e => setConfig(prev => ({ ...prev, lectureDuration: Number(e.target.value) }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Working Days</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DAYS.map(day => (
                  <label key={day} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.workingDays.includes(day)}
                      onChange={e => {
                        setConfig(prev => {
                          const updated = e.target.checked
                            ? [...prev.workingDays, day]
                            : prev.workingDays.filter(d => d !== day);
                          const sorted = [...updated].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
                          return {
                            ...prev,
                            workingDays: sorted,
                          };
                        });
                      }}
                      className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Breaks</span>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, breaks: [...prev.breaks, defaultBreak()] }))}
                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Add Break
                </button>
              </div>
              {config.breaks.map((breakRow, index) => (
                <div key={breakRow.id} className="grid gap-2 md:grid-cols-[180px_120px_80px_auto] items-center">
                  <input
                    type="text"
                    value={breakRow.breakName}
                    onChange={e => {
                      const updated = [...config.breaks];
                      updated[index].breakName = e.target.value;
                      setConfig(prev => ({ ...prev, breaks: updated }));
                    }}
                    placeholder="Break name"
                    className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={breakRow.afterSlot}
                    onChange={e => {
                      const updated = [...config.breaks];
                      updated[index].afterSlot = Number(e.target.value);
                      setConfig(prev => ({ ...prev, breaks: updated }));
                    }}
                    className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {Array.from({ length: config.totalSlots }, (_, i) => i + 1).map(slot => (
                      <option key={slot} value={slot}>After slot {slot}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={breakRow.duration}
                    onChange={e => {
                      const updated = [...config.breaks];
                      updated[index].duration = Number(e.target.value);
                      setConfig(prev => ({ ...prev, breaks: updated }));
                    }}
                    placeholder="Duration"
                    className="h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = config.breaks.filter((_, idx) => idx !== index);
                      setConfig(prev => ({ ...prev, breaks: updated }));
                    }}
                    className="h-8 rounded-lg bg-destructive px-2.5 text-xs font-semibold text-white hover:bg-destructive/90"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Timetable'}
              </button>
              <button
                type="button"
                onClick={handleSaveTimetable}
                disabled={savingTimetable}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingTimetable ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Live Timetable Preview">
          {previewSchedule.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Configure the timetable settings to preview generated slots instantly.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 w-36 border-r border-border text-center font-bold">Time</th>
                    {config.workingDays.map(day => (
                      <th key={day} className="p-3 border-r border-border text-center font-bold">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewGrid.map(row => (
                    <tr key={row.timeKey}>
                      <td className="p-3 border-r border-border bg-muted/20 font-semibold text-xs uppercase text-muted-foreground">
                        {row.startTime} - {row.endTime}
                      </td>
                      {row.items.map((item, index) => {
                        const cellClasses = item?.type === 'break'
                          ? 'bg-muted/10 text-center text-sm text-muted-foreground'
                          : 'align-top';

                        if (!item) {
                          return <td key={`${row.timeKey}-${index}`} className="p-3 border-r border-border bg-background" />;
                        }

                        if (item.type === 'break') {
                          return (
                            <td key={`${row.timeKey}-${item.dayOfWeek}`} className={`p-3 border-r border-border ${cellClasses}`}>
                              <div className="font-semibold">{item.breakName}</div>
                              <div className="text-[11px]">{item.startTime} - {item.endTime}</div>
                            </td>
                          );
                        }

                        const key = `${item.dayOfWeek}-${item.slotNumber}`;
                        const assignment = slotAssignments[key];

                        return (
                          <td key={`${row.timeKey}-${item.dayOfWeek}`} className={`p-3 border-r border-border ${cellClasses}`}>
                            <div className="space-y-2">
                              <select
                                value={assignment?.subjectId || ''}
                                onChange={e => handleAssignmentChange(item.dayOfWeek, item.slotNumber!, 'subjectId', e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                              >
                                <option value="">Subject</option>
                                {subjects.map(subject => (
                                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                                ))}
                              </select>
                              <select
                                value={assignment?.teacherId || ''}
                                onChange={e => handleAssignmentChange(item.dayOfWeek, item.slotNumber!, 'teacherId', e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                              >
                                <option value="">Teacher</option>
                                {teachers.map(teacher => {
                                  const activeSec = sections.find(s => (s._id || s.id) === config.sectionId);
                                  const isClassTeacher = activeSec?.classTeacherId === teacher._id;
                                  const name = `${teacher.user?.firstName || teacher.userId?.firstName || ""} ${teacher.user?.lastName || teacher.userId?.lastName || ""}`.trim();
                                  return (
                                    <option key={teacher._id} value={teacher._id}>
                                      {name || "Unnamed Teacher"}
                                      {isClassTeacher ? " (Class Teacher)" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
