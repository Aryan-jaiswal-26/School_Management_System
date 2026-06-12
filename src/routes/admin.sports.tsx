import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  Calendar,
  Medal,
  Activity,
  Plus,
  Swords,
  Dumbbell,
  Clock,
  Award,
  CalendarDays
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { 
  fetchSportsTeams, fetchTournaments, fetchActivities, createTeam, createTournament,
  fetchAchievements, createAchievement, fetchEvents, createEvent
} from "@/lib/sports-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/sports")({
  head: () => ({ meta: [{ title: "Sports & Extracurriculars · Campus OS" }] }),
  component: SportsPage,
});

function SportsPage() {
  const [tab, setTab] = useState<"teams" | "tournaments" | "enrollment" | "achievements" | "events">("teams");
  
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const [isInterSchool, setIsInterSchool] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for student selection in achievements
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");

  useEffect(() => {
    fetchSportsTeams().then(setTeams).catch(console.error);
    fetchTournaments().then(setTournaments).catch(console.error);
    fetchActivities().then(setActivities).catch(console.error);
    fetchAchievements().then(setAchievements).catch(console.error);
    fetchEvents().then(setEvents).catch(console.error);

    // Fetch classes and sections for achievement logging
    apiClient<any>("/academics/classes?page=1&limit=100")
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setClasses(Array.isArray(list) ? list : []);
      })
      .catch(console.error);

    apiClient<any>("/academics/sections?page=1&limit=100")
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setSections(Array.isArray(list) ? list : []);
      })
      .catch(console.error);
  }, []);

  // Fetch students dynamically when class and section are selected
  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      setStudents([]);
      setSelectedStudentName("");
      apiClient<any>(`/students?limit=100&classId=${selectedClassId}&sectionId=${selectedSectionId}`)
        .then((res) => {
          const studentDocs = res?.data?.data || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          setStudents(studentDocs);
        })
        .catch(console.error);
    } else {
      setStudents([]);
      setSelectedStudentName("");
    }
  }, [selectedClassId, selectedSectionId]);

  // Reset modal select fields when closed
  useEffect(() => {
    if (!isAchievementModalOpen) {
      setSelectedClassId("");
      setSelectedSectionId("");
      setSelectedStudentName("");
      setStudents([]);
    }
  }, [isAchievementModalOpen]);

  async function handleAddMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      date: fd.get("date"),
      location: fd.get("location"),
      teams: Number(fd.get("teams")),
      isInterSchool: isInterSchool,
      participatingSchools: isInterSchool ? String(fd.get("participatingSchools")).split(",").map(s => s.trim()) : [],
    };
    try {
      await createTournament(data);
      toast.success("Match scheduled successfully");
      setIsMatchModalOpen(false);
      setIsInterSchool(false);
      const newMatches = await fetchTournaments();
      setTournaments(newMatches);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule match");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      coach: fd.get("coach"),
      members: Number(fd.get("members")),
      status: fd.get("status"),
      nextMatch: fd.get("nextMatch") || "TBD"
    };
    try {
      await createTeam(data);
      toast.success("Team added successfully");
      setIsTeamModalOpen(false);
      const newTeams = await fetchSportsTeams();
      setTeams(newTeams);
    } catch (err: any) {
      toast.error(err.message || "Failed to add team");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddAchievement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      studentName: fd.get("studentName"),
      title: fd.get("title"),
      category: fd.get("category"),
      date: fd.get("date"),
      position: fd.get("position"),
      description: fd.get("description")
    };
    try {
      await createAchievement(data);
      toast.success("Achievement logged successfully");
      setIsAchievementModalOpen(false);
      const res = await fetchAchievements();
      setAchievements(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to log achievement");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      eventType: fd.get("eventType"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      organizer: fd.get("organizer"),
      status: fd.get("status")
    };
    try {
      await createEvent(data);
      toast.success("Event scheduled successfully");
      setIsEventModalOpen(false);
      const res = await fetchEvents();
      setEvents(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule event");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports & Extracurriculars"
        subtitle="Manage teams, coach assignments, tournaments, student activity enrollments, and events."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Sports Teams" value={teams.length.toString()} icon={Dumbbell} tone="info" />
        <StatCard label="Upcoming Matches" value={tournaments.length.toString()} icon={Swords} tone="warning" />
        <StatCard label="Trophies & Records" value={achievements.length.toString()} icon={Trophy} tone="success" />
        <StatCard
          label="Students Enrolled"
          value={activities.reduce((acc, a) => acc + (a.enrolled || 0), 0).toString()}
          icon={Activity}
          tone="success"
          delta="In Extracurriculars"
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["teams", "Teams & Coaches", Users],
            ["tournaments", "Match Schedule", Calendar],
            ["enrollment", "Activity Enrollment", Medal],
            ["achievements", "Achievements", Award],
            ["events", "Events Schedule", CalendarDays],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
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

      {tab === "teams" && (
        <Panel
          title="Sports Teams & Coach Assignments"
          action={
            <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> New Team
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.length === 0 ? <p className="text-sm text-muted-foreground p-4">No teams found.</p> : teams.map((team) => (
              <div
                key={team._id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-foreground text-base">{team.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Coach: {team.coach}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-medium bg-muted/50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4 text-foreground" /> {team.members} Members
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${team.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"}`}
                  >
                    {team.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-destructive" /> Next Match:
                  </span>
                  {team.nextMatch}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "tournaments" && (
        <Panel
          title="Tournament & Match Calendar"
          action={
            <button onClick={() => setIsMatchModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Schedule Match
            </button>
          }
        >
          <div className="space-y-4">
            {tournaments.length === 0 ? <p className="text-sm text-muted-foreground p-4">No matches scheduled.</p> : tournaments.map((t) => (
              <div
                key={t._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm gap-4 hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${t.isInterSchool ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      {t.name}
                      {t.isInterSchool && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 text-[9px] uppercase font-bold dark:bg-indigo-900/40 dark:text-indigo-300">
                          Inter-School
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Clock className="h-3.5 w-3.5" /> {t.date}
                    </p>
                    {t.isInterSchool && t.participatingSchools && t.participatingSchools.length > 0 && (
                       <p className="text-[10px] text-muted-foreground mt-1 max-w-sm truncate">
                         Vs: {t.participatingSchools.join(", ")}
                       </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="text-right">
                    <div className="text-foreground">{t.location}</div>
                    <div className="text-muted-foreground">{t.teams} Teams Competing</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "enrollment" && (
        <Panel title="Extracurricular Activity Enrollment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.length === 0 ? <p className="text-sm text-muted-foreground p-4">No activities found.</p> : activities.map((a) => {
              const isFull = a.enrolled >= a.max;
              return (
                <div key={a._id} className="p-4 rounded-xl border border-border bg-card shadow-sm">
                  <h4 className="font-bold text-foreground mb-1">{a.name}</h4>
                  <p className="text-xs text-muted-foreground mb-4">Instructor: {a.instructor}</p>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Enrollment</span>
                      <span className={isFull ? "text-destructive" : "text-foreground"}>
                        {a.enrolled} / {a.max}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isFull ? "bg-destructive" : "bg-emerald-500"}`}
                        style={{ width: `${(a.enrolled / a.max) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={isFull}
                    className="w-full h-8 rounded-lg bg-muted text-foreground text-xs font-bold disabled:opacity-50 hover:bg-accent hover:text-white transition-all uppercase tracking-wider"
                  >
                    {isFull ? "Waitlist Full" : "Manage Roster"}
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === "achievements" && (
        <Panel
          title="Student Achievements & Trophies"
          action={
            <button onClick={() => setIsAchievementModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Log Achievement
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.length === 0 ? <p className="text-sm text-muted-foreground p-4">No achievements logged yet.</p> : achievements.map((ach) => (
              <div key={ach._id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted/50 px-2 py-0.5 rounded">
                    {ach.category}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{ach.title}</h4>
                  <p className="text-xs font-medium text-foreground mt-0.5">{ach.studentName}</p>
                </div>
                {ach.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {ach.description}
                  </p>
                )}
                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border mt-auto">
                  Logged: {ach.date}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "events" && (
        <Panel
          title="Sports Day & Annual Events"
          action={
            <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Schedule Event
            </button>
          }
        >
          <div className="space-y-4">
            {events.length === 0 ? <p className="text-sm text-muted-foreground p-4">No events scheduled.</p> : events.map((ev) => (
              <div key={ev._id} className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground text-base">{ev.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ev.status === 'Completed' ? 'bg-muted text-muted-foreground' : ev.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ev.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Type: {ev.eventType} • Organizer: {ev.organizer}</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-medium text-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
                    {ev.startDate} <span className="text-muted-foreground mx-1">to</span> {ev.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTeam} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Varsity Basketball" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Coach Name</Label>
              <Input id="coach" name="coach" required placeholder="e.g. John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="members">Members Count</Label>
                <Input id="members" name="members" type="number" min="1" required placeholder="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextMatch">Next Match (Optional)</Label>
              <Input id="nextMatch" name="nextMatch" placeholder="e.g. vs Oakridge High - Oct 12" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsTeamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMatchModalOpen} onOpenChange={setIsMatchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Match</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMatch} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament / Match Name</Label>
              <Input id="match-name" name="name" required placeholder="e.g. Inter-school Basketball Finals" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" name="date" required placeholder="e.g. Oct 15, 2024 at 10:00 AM" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" required placeholder="Main Stadium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teams">Number of Teams</Label>
                <Input id="teams" name="teams" type="number" min="2" required placeholder="2" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isInterSchool" 
                checked={isInterSchool}
                onChange={(e) => setIsInterSchool(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <Label htmlFor="isInterSchool" className="text-sm">This is an Inter-School Competition</Label>
            </div>
            
            {isInterSchool && (
              <div className="space-y-2">
                <Label htmlFor="participatingSchools">Participating Schools (comma separated)</Label>
                <Input id="participatingSchools" name="participatingSchools" required placeholder="Oakridge High, Springfield Academy" />
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsMatchModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Match"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAchievementModalOpen} onOpenChange={setIsAchievementModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Student Achievement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAchievement} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classSelect">Class / Grade</Label>
                <select
                  id="classSelect"
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((c: any) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionSelect">Section / Division</Label>
                <select
                  id="sectionSelect"
                  value={selectedSectionId}
                  disabled={!selectedClassId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  required
                >
                  <option value="">Select Section</option>
                  {sections
                    .filter((s: any) => {
                      const classRef = typeof s.classId === "string" ? s.classId : (s.classId?._id || s.classId?.id || s.classId);
                      return String(classRef) === String(selectedClassId);
                    })
                    .map((s: any) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentSelect">Student Name</Label>
              <select
                id="studentSelect"
                name="studentName"
                value={selectedStudentName}
                disabled={!selectedClassId || !selectedSectionId}
                onChange={(e) => setSelectedStudentName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                required
              >
                <option value="">
                  {!selectedClassId || !selectedSectionId
                    ? "Select class & section first"
                    : students.length === 0
                    ? "No students found in this division"
                    : "Select Student"}
                </option>
                {students.map((s: any) => {
                  const fullName = `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim();
                  const code = s.admissionNumber || s.studentCode || s.rollNumber || "N/A";
                  return (
                    <option key={s._id || s.id} value={fullName}>
                      {fullName} ({code})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Achievement / Trophy Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Gold Medal - 100m Sprint" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="Sports">Sports</option>
                  <option value="Extracurricular">Extracurricular</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position / Rank</Label>
                <select id="position" name="position" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="None">None / Participant</option>
                  <option value="1st Position">1st Position (Gold)</option>
                  <option value="2nd Position">2nd Position (Silver)</option>
                  <option value="3rd Position">3rd Position (Bronze)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea id="description" name="description" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Details about the achievement..." />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAchievementModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging..." : "Log Achievement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Annual Sports Day 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <select id="eventType" name="eventType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="Sports Day">Sports Day</option>
                  <option value="Annual Day">Annual Day</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer">Organizer</Label>
                <Input id="organizer" name="organizer" required placeholder="e.g. Sports Dept" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
