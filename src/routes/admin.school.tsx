import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  GraduationCap,
  Layers3,
  Plus,
  School2,
  Save,
  Shapes,
  Trash2,
  Users,
  Palette,
  Search,
  Calendar,
  X,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { getRolePath, isAdminPortalRole, useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/school")({
  component: Page,
});

type AnyRecord = Record<string, unknown>;

interface SchoolRecord extends AnyRecord {
  name?: string;
  code?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  whiteLabel?: {
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
    logoUrl?: string;
    customTitle?: string;
  };
}

const tabs = [
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "branding", label: "Branding & Theme", icon: Palette },
  { id: "years", label: "Academic Years", icon: CalendarDays },
  { id: "terms", label: "Terms", icon: Layers3 },
  { id: "classes", label: "Classes & Sections", icon: School2 },
  { id: "subjects", label: "Subjects", icon: GraduationCap },
  { id: "calendar", label: "School Calendar", icon: Shapes },
] as const;

function hexToHslString(hex: string): string {
  let r = 0,
    g = 0,
    b = 0;
  if (!hex || hex[0] !== "#") return "221.2 83.2% 53.3%";
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeList<T = AnyRecord>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  if (isRecord(response)) {
    const directData = response.data;
    if (Array.isArray(directData)) return directData as T[];
    if (Array.isArray(response.results)) return response.results as T[];
    if (Array.isArray(response.docs)) return response.docs as T[];
    if (isRecord(directData)) {
      if (Array.isArray(directData.data)) return directData.data as T[];
      if (Array.isArray(directData.results)) return directData.results as T[];
      if (Array.isArray(directData.docs)) return directData.docs as T[];
    }
  }
  return [];
}

function toInputDate(value?: string | Date) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function Page() {
  const { user, authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("profile");
  const [loading, setLoading] = useState(true);

  const [school, setSchool] = useState<AnyRecord | null>(null);
  const [academicYears, setAcademicYears] = useState<AnyRecord[]>([]);
  const [terms, setTerms] = useState<AnyRecord[]>([]);
  const [classes, setClasses] = useState<AnyRecord[]>([]);
  const [sections, setSections] = useState<AnyRecord[]>([]);
  const [subjects, setSubjects] = useState<AnyRecord[]>([]);
  const [timetables, setTimetables] = useState<AnyRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<AnyRecord[]>([]);
  const [employees, setEmployees] = useState<AnyRecord[]>([]);

  const [schoolForm, setSchoolForm] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [yearForm, setYearForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });
  const [termForm, setTermForm] = useState({
    academicYearId: "",
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [classForm, setClassForm] = useState({ name: "", description: "", sections: "" });
  const [sectionForm, setSectionForm] = useState({
    classId: "",
    name: "",
    classTeacherId: "",
    capacity: "",
  });
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
    type: "CORE",
  });
  const [classSubjectForm, setClassSubjectForm] = useState({
    selectedClass: "",
  });
  const [subjectsViewClass, setSubjectsViewClass] = useState("");
  const [timetableForm, setTimetableForm] = useState({
    classId: "",
    sectionId: "",
    subjectId: "",
    teacherId: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    room: "",
  });
  const [calendarForm, setCalendarForm] = useState({
    title: "",
    date: "",
    type: "event",
    tickets: "Free",
    rsvpCount: "0",
  });
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    faviconUrl: "",
    logoUrl: "",
    customTitle: "",
  });
  const [subjectSearch, setSubjectSearch] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());

  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addingSectionForClassId, setAddingSectionForClassId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const schoolId = user?.schoolId;
  const roleAllowed = user && isAdminPortalRole(user.role);

  const classOptions = useMemo(() => classes, [classes]);
  const sectionOptions = useMemo(() => sections, [sections]);
  const subjectOptions = useMemo(() => subjects, [subjects]);
  const yearOptions = useMemo(() => academicYears, [academicYears]);
  const teacherOptions = useMemo(
    () =>
      employees.filter((employee) => {
        const role = (employee.user?.role || employee.role || "").toUpperCase();
        return (
          role === "TEACHER" ||
          role === "SUPER_ADMIN" ||
          role === "SCHOOL_ADMIN" ||
          role === "ADMIN"
        );
      }),
    [employees],
  );

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [
        schoolRes,
        yearsRes,
        termsRes,
        classesRes,
        sectionsRes,
        subjectsRes,
        timetableRes,
        eventsRes,
        employeesRes,
      ] = await Promise.allSettled([
        apiClient<SchoolRecord>(`/schools/${schoolId}`),
        apiClient<AnyRecord>(`/schools/${schoolId}/academic-years?page=1&limit=100`),
        apiClient<AnyRecord>(`/schools/${schoolId}/terms?page=1&limit=100`),
        apiClient<AnyRecord>(`/academics/classes?page=1&limit=100`),
        apiClient<AnyRecord>(`/academics/sections?page=1&limit=100`),
        apiClient<AnyRecord>(`/academics/subjects/manage?page=1&limit=100`),
        apiClient<AnyRecord>(`/academics/timetable/manage?page=1&limit=100`),
        apiClient<AnyRecord>(`/events`),
        apiClient<AnyRecord>(`/employees?page=1&limit=100`),
      ]);

      if (schoolRes.status === "fulfilled") {
        const schoolData = schoolRes.value;
        setSchool(schoolData);
        setSchoolForm({
          name: schoolData?.name || "",
          code: schoolData?.code || "",
          address: schoolData?.address || "",
          contactEmail: schoolData?.contactEmail || "",
          contactPhone: schoolData?.contactPhone || "",
        });
        setBrandingForm({
          primaryColor: schoolData?.whiteLabel?.primaryColor || "#3b82f6",
          secondaryColor: schoolData?.whiteLabel?.secondaryColor || "#1e293b",
          faviconUrl: schoolData?.whiteLabel?.faviconUrl || "",
          logoUrl: schoolData?.whiteLabel?.logoUrl || "",
          customTitle: schoolData?.whiteLabel?.customTitle || "",
        });
      } else {
        setSchool(null);
        setSchoolForm({
          name: "",
          code: "",
          address: "",
          contactEmail: "",
          contactPhone: "",
        });
      }

      setAcademicYears(yearsRes.status === "fulfilled" ? normalizeList(yearsRes.value) : []);
      setTerms(termsRes.status === "fulfilled" ? normalizeList(termsRes.value) : []);
      setClasses(classesRes.status === "fulfilled" ? normalizeList(classesRes.value) : []);
      setSections(sectionsRes.status === "fulfilled" ? normalizeList(sectionsRes.value) : []);
      setSubjects(subjectsRes.status === "fulfilled" ? normalizeList(subjectsRes.value) : []);
      setTimetables(timetableRes.status === "fulfilled" ? normalizeList(timetableRes.value) : []);
      setCalendarEvents(eventsRes.status === "fulfilled" ? normalizeList(eventsRes.value) : []);
      setEmployees(employeesRes.status === "fulfilled" ? normalizeList(employeesRes.value) : []);

      const failedSections = [
        ["school profile", schoolRes],
        ["academic years", yearsRes],
        ["terms", termsRes],
        ["classes", classesRes],
        ["sections", sectionsRes],
        ["subjects", subjectsRes],
        ["timetables", timetableRes],
        ["calendar events", eventsRes],
        ["employees", employeesRes],
      ]
        .filter(([, result]) => result.status === "rejected")
        .map(([label]) => label);

      if (failedSections.length > 0) {
        toast.error(`Some school setup data failed to load: ${failedSections.join(", ")}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load school setup data");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [loadData, schoolId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading school setup…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!roleAllowed) {
    return <Navigate to={getRolePath(user.role, user.schoolId)} />;
  }

  if (!schoolId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="text-lg font-semibold">School context missing</div>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not resolve the current school for this account.
          </p>
        </div>
      </div>
    );
  }

  const refresh = async () => {
    await loadData();
  };

  const updateSchool = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiClient(`/schools/${schoolId}`, { method: "PATCH", data: schoolForm });
      toast.success("School profile updated");
      await refresh();
    } catch (error) {
      toast.error("Unable to update school profile");
    }
  };

  const updateBranding = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiClient(`/schools/${schoolId}`, {
        method: "PATCH",
        data: {
          whiteLabel: brandingForm,
        },
      });
      toast.success("School branding & theme updated successfully!");

      const root = document.documentElement;
      root.style.setProperty("--primary", hexToHslString(brandingForm.primaryColor));
      root.style.setProperty("--accent", hexToHslString(brandingForm.primaryColor));

      await refresh();
    } catch (error) {
      toast.error("Unable to update school branding");
    }
  };

  const submitAcademicYear = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        name: yearForm.name,
        startDate: yearForm.startDate,
        endDate: yearForm.endDate,
        isCurrent: yearForm.isCurrent,
      };
      if (editingYearId) {
        await apiClient(`/schools/${schoolId}/academic-years/${editingYearId}`, {
          method: "PATCH",
          data: payload,
        });
        toast.success("Academic year updated");
      } else {
        await apiClient(`/schools/${schoolId}/academic-years`, { method: "POST", data: payload });
        toast.success("Academic year created");
      }
      setYearForm({ name: "", startDate: "", endDate: "", isCurrent: false });
      setEditingYearId(null);
      await refresh();
    } catch {
      toast.error("Academic year save failed");
    }
  };

  const submitTerm = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        academicYearId: termForm.academicYearId,
        name: termForm.name,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        isActive: termForm.isActive,
      };
      if (editingTermId) {
        await apiClient(`/schools/${schoolId}/terms/${editingTermId}`, {
          method: "PATCH",
          data: payload,
        });
        toast.success("Term updated");
      } else {
        await apiClient(`/schools/${schoolId}/terms`, { method: "POST", data: payload });
        toast.success("Term created");
      }
      setTermForm({ academicYearId: "", name: "", startDate: "", endDate: "", isActive: true });
      setEditingTermId(null);
      await refresh();
    } catch {
      toast.error("Term save failed");
    }
  };

  const submitClass = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const sectionsArray = classForm.sections
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        name: classForm.name,
        description: classForm.description,
        sections: sectionsArray,
      };

      if (editingClassId) {
        await apiClient(`/academics/classes/${editingClassId}`, {
          method: "PATCH",
          data: { name: classForm.name, description: classForm.description },
        });
        toast.success("Class updated");
      } else {
        await apiClient("/academics/classes", { method: "POST", data: payload });
        toast.success("Class created successfully");
      }
      setClassForm({ name: "", description: "", sections: "" });
      setEditingClassId(null);
      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Class save failed");
    }
  };

  const handleAddSectionInline = async (classId: string) => {
    if (!newSectionName.trim()) return;
    try {
      await apiClient("/academics/sections", {
        method: "POST",
        data: { classId, name: newSectionName.trim() },
      });
      toast.success("Section added successfully");
      setNewSectionName("");
      setAddingSectionForClassId(null);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to add section");
    }
  };

  const submitSection = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        classId: sectionForm.classId,
        name: sectionForm.name,
        classTeacherId: sectionForm.classTeacherId || undefined,
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined,
      };
      if (editingSectionId) {
        await apiClient(`/academics/sections/${editingSectionId}`, {
          method: "PATCH",
          data: payload,
        });
        toast.success("Section updated");
      } else {
        await apiClient("/academics/sections", { method: "POST", data: payload });
        toast.success("Section created");
      }
      setSectionForm({ classId: "", name: "", classTeacherId: "", capacity: "" });
      setEditingSectionId(null);
      await refresh();
    } catch {
      toast.error("Section save failed");
    }
  };

  const submitSubject = async (event: FormEvent) => {
    event.preventDefault();
    if (!subjectForm.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    try {
      const payload = {
        name: subjectForm.name.trim(),
        classId: classSubjectForm.selectedClass,
      };
      await apiClient("/academics/subjects", { method: "POST", data: payload });
      toast.success("Subject created");
      setSubjectForm({ name: "", code: "", description: "", type: "CORE" });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Subject save failed");
    }
  };

  const submitTimetable = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        classId: timetableForm.classId,
        sectionId: timetableForm.sectionId || undefined,
        subjectId: timetableForm.subjectId,
        teacherId: timetableForm.teacherId,
        dayOfWeek: timetableForm.dayOfWeek,
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
        room: timetableForm.room,
      };
      if (editingTimetableId) {
        await apiClient(`/academics/timetable/${editingTimetableId}`, {
          method: "PATCH",
          data: payload,
        });
        toast.success("Timetable updated");
      } else {
        await apiClient("/academics/timetable", { method: "POST", data: payload });
        toast.success("Timetable created");
      }
      setTimetableForm({
        classId: "",
        sectionId: "",
        subjectId: "",
        teacherId: "",
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        room: "",
      });
      setEditingTimetableId(null);
      await refresh();
    } catch (error) {
      toast.error("Timetable save failed");
    }
  };

  const submitEvent = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        title: calendarForm.title,
        date: calendarForm.date,
        type: calendarForm.type,
        tickets: calendarForm.tickets,
        rsvpCount: Number(calendarForm.rsvpCount || 0),
      };
      if (editingEventId) {
        await apiClient(`/events/${editingEventId}`, { method: "PATCH", data: payload });
        toast.success("Calendar event updated");
      } else {
        await apiClient("/events", { method: "POST", data: payload });
        toast.success("Calendar event created");
      }
      setCalendarForm({ title: "", date: "", type: "event", tickets: "Free", rsvpCount: "0" });
      setEditingEventId(null);
      await refresh();
    } catch {
      toast.error("Calendar save failed");
    }
  };

  const removeByEndpoint = async (endpoint: string, label: string) => {
    if (!confirm(`Are you sure you want to delete this ${label.toLowerCase()}?`)) {
      return;
    }
    try {
      await apiClient(endpoint, { method: "DELETE" });
      toast.success(`${label} deleted successfully`);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || `Failed to delete ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Setup"
        subtitle="Manage the school profile and the full academic structure from one place."
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "profile" && (
        <Panel title="School Profile">
          <form onSubmit={updateSchool} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Name</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm((p) => ({ ...p, name: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Code</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={schoolForm.code}
                onChange={(e) => setSchoolForm((p) => ({ ...p, code: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium">Address</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={schoolForm.address}
                onChange={(e) => setSchoolForm((p) => ({ ...p, address: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={schoolForm.contactEmail}
                onChange={(e) => setSchoolForm((p) => ({ ...p, contactEmail: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Phone</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={schoolForm.contactPhone}
                onChange={(e) => setSchoolForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Save className="h-4 w-4" />
                Save Profile
              </button>
            </div>
          </form>
        </Panel>
      )}

      {activeTab === "branding" && (
        <Panel title="White-Label Theme & Academy Branding">
          <form onSubmit={updateBranding} className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Update the branding values below directly from the connected backend school record.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-primary" />
                  Primary Accent Color (Hex)
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 rounded-lg border border-border p-1 bg-background cursor-pointer"
                    value={brandingForm.primaryColor}
                    onChange={(e) =>
                      setBrandingForm((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                  />
                  <input
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 font-mono"
                    value={brandingForm.primaryColor}
                    onChange={(e) =>
                      setBrandingForm((p) => ({ ...p, primaryColor: e.target.value }))
                    }
                  />
                </div>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Secondary Base Color (Hex)
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 rounded-lg border border-border p-1 bg-background cursor-pointer"
                    value={brandingForm.secondaryColor}
                    onChange={(e) =>
                      setBrandingForm((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                  />
                  <input
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 font-mono"
                    value={brandingForm.secondaryColor}
                    onChange={(e) =>
                      setBrandingForm((p) => ({ ...p, secondaryColor: e.target.value }))
                    }
                  />
                </div>
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-foreground">
                  Custom Application Title / Brand Name
                </span>
                <input
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                  value={brandingForm.customTitle}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, customTitle: e.target.value }))}
                  placeholder="e.g. Scholar Spark Galaxy"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">School Logo URL</span>
                <input
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                  value={brandingForm.logoUrl}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">School Favicon Icon URL</span>
                <input
                  className="w-full h-10 rounded-lg border border-border bg-background px-3"
                  value={brandingForm.faviconUrl}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, faviconUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <div className="md:col-span-2 flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-md active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Save Academy Branding & Theme
                </button>
              </div>
            </div>
          </form>
        </Panel>
      )}

      {activeTab === "years" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={editingYearId ? "Edit Academic Year" : "Create Academic Year"}>
            <form onSubmit={submitAcademicYear} className="space-y-3">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="2026-2027"
                value={yearForm.name}
                onChange={(e) => setYearForm((p) => ({ ...p, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm((p) => ({ ...p, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={yearForm.isCurrent}
                  onChange={(e) => setYearForm((p) => ({ ...p, isCurrent: e.target.checked }))}
                />
                Mark as current
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {editingYearId ? "Update" : "Create"}
                </button>
                {editingYearId && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                    onClick={() => {
                      setEditingYearId(null);
                      setYearForm({ name: "", startDate: "", endDate: "", isCurrent: false });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>
          <Panel title="Academic Years">
            <div className="space-y-2">
              {academicYears.map((year) => (
                <div
                  key={year._id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="font-medium">{year.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {toInputDate(year.startDate)} → {toInputDate(year.endDate)}{" "}
                      {year.isCurrent ? "· Current" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs"
                      onClick={() => {
                        setEditingYearId(year._id);
                        setYearForm({
                          name: year.name || "",
                          startDate: toInputDate(year.startDate),
                          endDate: toInputDate(year.endDate),
                          isCurrent: !!year.isCurrent,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-destructive/30 px-3 py-1 text-xs text-destructive"
                      onClick={() =>
                        removeByEndpoint(
                          `/schools/${schoolId}/academic-years/${year._id}`,
                          "Academic year",
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "terms" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={editingTermId ? "Edit Term" : "Create Term"}>
            <form onSubmit={submitTerm} className="space-y-3">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={termForm.academicYearId}
                onChange={(e) => setTermForm((p) => ({ ...p, academicYearId: e.target.value }))}
              >
                <option value="">Select academic year</option>
                {yearOptions.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="Term 1"
                value={termForm.name}
                onChange={(e) => setTermForm((p) => ({ ...p, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={termForm.startDate}
                  onChange={(e) => setTermForm((p) => ({ ...p, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={termForm.endDate}
                  onChange={(e) => setTermForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={termForm.isActive}
                  onChange={(e) => setTermForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {editingTermId ? "Update" : "Create"}
                </button>
                {editingTermId && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                    onClick={() => {
                      setEditingTermId(null);
                      setTermForm({
                        academicYearId: "",
                        name: "",
                        startDate: "",
                        endDate: "",
                        isActive: true,
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>
          <Panel title="Terms">
            <div className="space-y-2">
              {terms.map((term) => (
                <div
                  key={term._id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="font-medium">{term.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {term.academicYearId?.name || "Academic year"} · {toInputDate(term.startDate)}{" "}
                      → {toInputDate(term.endDate)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs"
                      onClick={() => {
                        setEditingTermId(term._id);
                        setTermForm({
                          academicYearId: term.academicYearId?._id || term.academicYearId || "",
                          name: term.name || "",
                          startDate: toInputDate(term.startDate),
                          endDate: toInputDate(term.endDate),
                          isActive: !!term.isActive,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-destructive/30 px-3 py-1 text-xs text-destructive"
                      onClick={() =>
                        removeByEndpoint(`/schools/${schoolId}/terms/${term._id}`, "Term")
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-4 space-y-6">
            <Panel title={editingClassId ? "Edit Class" : "Create Class & Sections"}>
              <form onSubmit={submitClass} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Class Name *</label>
                  <input
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Grade 10"
                    value={classForm.name}
                    onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                {!editingClassId && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Initial Sections (comma-separated)
                    </label>
                    <input
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. A, B, C"
                      value={classForm.sections}
                      onChange={(e) => setClassForm((p) => ({ ...p, sections: e.target.value }))}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Enter section names separated by commas. Leave empty if no sections are needed yet.
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                  >
                    {editingClassId ? "Update Class" : "Create Class & Sections"}
                  </button>
                  {editingClassId && (
                    <button
                      type="button"
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                      onClick={() => {
                        setEditingClassId(null);
                        setClassForm({ name: "", description: "", sections: "" });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </Panel>
          </div>

          <div className="lg:col-span-8">
            <Panel title="Classes & Sections Directory">
              <div className="space-y-4">
                {classes.map((cls) => {
                  const classSections = sections.filter(
                    (s) =>
                      s.classId === cls._id ||
                      (s.classId?._id && s.classId._id === cls._id)
                  );
                  return (
                    <div
                      key={cls._id}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-foreground">
                            {cls.name}
                          </h3>
                          {cls.description && (
                            <p className="text-sm text-muted-foreground">
                              {cls.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className="rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-muted transition-all"
                            onClick={() => {
                              setEditingClassId(cls._id);
                              setClassForm({
                                name: cls.name || "",
                                description: cls.description || "",
                                sections: "",
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-destructive/20 hover:bg-destructive hover:text-white px-3 py-1 text-xs font-semibold text-destructive transition-all"
                            onClick={() => removeByEndpoint(`/academics/classes/${cls._id}`, "Class")}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Sections List */}
                      <div className="mt-4 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Sections / Divisions ({classSections.length})
                          </span>
                          {addingSectionForClassId !== cls._id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingSectionForClassId(cls._id);
                                setNewSectionName("");
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Section
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                className="h-7 w-28 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
                                placeholder="Section Name (e.g. D)"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleAddSectionInline(cls._id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => void handleAddSectionInline(cls._id)}
                                className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingSectionForClassId(null)}
                                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {classSections.map((sec) => (
                            <span
                              key={sec._id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-all hover:bg-muted"
                            >
                              <span>Section {sec.name}</span>
                              {sec.capacity && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({sec.capacity} cap)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeByEndpoint(
                                    `/academics/sections/${sec._id}`,
                                    "Section"
                                  )
                                }
                                className="ml-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title={`Delete Section ${sec.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {classSections.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">
                              No sections defined for this class. Click Add Section to create one.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      )}


      {activeTab === "subjects" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Add Subject to Class">
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">1. Select a Class</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={classSubjectForm.selectedClass}
                  onChange={(e) => {
                    setClassSubjectForm((p) => ({
                      ...p,
                      selectedClass: e.target.value,
                    }));
                  }}
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">2. Add a Subject</label>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Subject Name (e.g., Mathematics)"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  submitSubject(e);
                }}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                disabled={!classSubjectForm.selectedClass}
              >
                Add Subject
              </button>
            </form>
          </Panel>

          <Panel
            title="Subjects by Class"
            action={
              <select
                className="h-7 w-48 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                value={subjectsViewClass}
                onChange={(e) => setSubjectsViewClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            }
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {subjects
                .filter((sub) => !subjectsViewClass || sub.classId?._id === subjectsViewClass)
                .map((subject) => (
                  <div
                    key={subject._id}
                    className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-card/65 transition hover:shadow-sm hover:border-primary/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {subject.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{subject.classId?.name || "N/A"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-destructive/20 hover:bg-destructive hover:text-white px-2.5 py-1 text-xs font-semibold text-destructive transition-all"
                      onClick={() =>
                        removeByEndpoint(`/academics/subjects/${subject._id}`, "Subject")
                      }
                    >
                      Delete
                    </button>
                  </div>
                ))}
              {subjects.filter((sub) => !subjectsViewClass || sub.classId?._id === subjectsViewClass).length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No subjects found.
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "timetables" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={editingTimetableId ? "Edit Timetable" : "Create Timetable"}>
            <form onSubmit={submitTimetable} className="space-y-3">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={timetableForm.classId}
                onChange={(e) => setTimetableForm((p) => ({ ...p, classId: e.target.value }))}
              >
                <option value="">Select class</option>
                {classOptions.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={timetableForm.sectionId}
                onChange={(e) => setTimetableForm((p) => ({ ...p, sectionId: e.target.value }))}
              >
                <option value="">Select section</option>
                {sectionOptions.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name} · {section.classId?.name || "Class"}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={timetableForm.subjectId}
                onChange={(e) => setTimetableForm((p) => ({ ...p, subjectId: e.target.value }))}
              >
                <option value="">Select subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={timetableForm.teacherId}
                onChange={(e) => setTimetableForm((p) => ({ ...p, teacherId: e.target.value }))}
              >
                <option value="">Select teacher</option>
                {teacherOptions.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.user?.firstName || employee.user?.email || "Teacher"} ·{" "}
                    {employee.employeeId}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={timetableForm.dayOfWeek}
                  onChange={(e) => setTimetableForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Room"
                  value={timetableForm.room}
                  onChange={(e) => setTimetableForm((p) => ({ ...p, room: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={timetableForm.startTime}
                  onChange={(e) => setTimetableForm((p) => ({ ...p, startTime: e.target.value }))}
                />
                <input
                  type="time"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={timetableForm.endTime}
                  onChange={(e) => setTimetableForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {editingTimetableId ? "Update" : "Create"}
                </button>
                {editingTimetableId && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                    onClick={() => {
                      setEditingTimetableId(null);
                      setTimetableForm({
                        classId: "",
                        sectionId: "",
                        subjectId: "",
                        teacherId: "",
                        dayOfWeek: "Monday",
                        startTime: "09:00",
                        endTime: "10:00",
                        room: "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>
          <Panel title="Timetables">
            <div className="space-y-2">
              {timetables.map((slot) => (
                <div
                  key={slot._id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {slot.dayOfWeek} · {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slot.classId?.name || "Class"}{" "}
                      {slot.sectionId?.name ? `· ${slot.sectionId.name}` : ""} ·{" "}
                      {slot.subjectId?.name || "Subject"} ·{" "}
                      {slot.teacherId?.userId
                        ? `${slot.teacherId.userId.firstName || ""} ${slot.teacherId.userId.lastName || ""}`.trim()
                        : "Teacher"}{" "}
                      · {slot.room || "Room"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs"
                      onClick={() => {
                        setEditingTimetableId(slot._id);
                        setTimetableForm({
                          classId: slot.classId?._id || slot.classId || "",
                          sectionId: slot.sectionId?._id || slot.sectionId || "",
                          subjectId: slot.subjectId?._id || slot.subjectId || "",
                          teacherId: slot.teacherId?._id || slot.teacherId || "",
                          dayOfWeek: slot.dayOfWeek || "Monday",
                          startTime: slot.startTime || "09:00",
                          endTime: slot.endTime || "10:00",
                          room: slot.room || "",
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-destructive/30 px-3 py-1 text-xs text-destructive"
                      onClick={() =>
                        removeByEndpoint(`/academics/timetable/${slot._id}`, "Timetable")
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={editingEventId ? "Edit Calendar Event" : "Create Calendar Event"}>
            <form onSubmit={submitEvent} className="space-y-3">
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="Sports Day"
                value={calendarForm.title}
                onChange={(e) => setCalendarForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={calendarForm.date}
                onChange={(e) => setCalendarForm((p) => ({ ...p, date: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={calendarForm.type}
                onChange={(e) => setCalendarForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="event">Event</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="deadline">Deadline</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Free / Paid"
                  value={calendarForm.tickets}
                  onChange={(e) => setCalendarForm((p) => ({ ...p, tickets: e.target.value }))}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="RSVP Count"
                  value={calendarForm.rsvpCount}
                  onChange={(e) => setCalendarForm((p) => ({ ...p, rsvpCount: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {editingEventId ? "Update" : "Create"}
                </button>
                {editingEventId && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                    onClick={() => {
                      setEditingEventId(null);
                      setCalendarForm({
                        title: "",
                        date: "",
                        type: "event",
                        tickets: "Free",
                        rsvpCount: "0",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>
          <Panel
            title="Academy Calendar & Events Feed"
            action={
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={calendarSearch}
                  onChange={(e) => setCalendarSearch(e.target.value)}
                  className="h-7 w-full rounded-md border border-border bg-background py-1 pl-8 pr-2 text-xs outline-none focus:border-primary"
                />
              </div>
            }
          >
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {calendarEvents
                .filter((evt) => {
                  const query = calendarSearch.toLowerCase();
                  return (
                    (evt.title || "").toLowerCase().includes(query) ||
                    (evt.type || "").toLowerCase().includes(query)
                  );
                })
                .map((eventItem) => {
                  const isExam = eventItem.type === "exam";
                  const isHoliday = eventItem.type === "holiday";
                  const isDeadline = eventItem.type === "deadline";

                  return (
                    <div
                      key={eventItem._id}
                      className={`flex items-start justify-between rounded-xl border p-4 bg-card/65 transition hover:shadow-sm ${
                        isExam
                          ? "border-purple-500/25 bg-purple-500/5 hover:border-purple-500/40"
                          : isHoliday
                            ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40"
                            : isDeadline
                              ? "border-rose-500/25 bg-rose-500/5 hover:border-rose-500/40"
                              : "border-blue-500/25 bg-blue-500/5 hover:border-blue-500/40"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold border ${
                            isExam
                              ? "bg-purple-100 text-purple-700 border-purple-200"
                              : isHoliday
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : isDeadline
                                  ? "bg-rose-100 text-rose-700 border-rose-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          <span className="text-xs uppercase font-extrabold">
                            {eventItem.type?.slice(0, 4)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-foreground leading-snug">
                            {eventItem.title}
                          </h4>
                          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-foreground">
                              {toInputDate(eventItem.date)}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{eventItem.type}</span>
                            <span>•</span>
                            <span className="bg-muted px-1.5 py-0.5 rounded font-medium text-[10px] text-foreground">
                              {eventItem.tickets || "Free"}
                            </span>
                            {eventItem.rsvpCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-bold">
                                  {eventItem.rsvpCount} RSVPs
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-4 mt-0.5">
                        <button
                          type="button"
                          className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                          onClick={() => {
                            setEditingEventId(eventItem._id);
                            setCalendarForm({
                              title: eventItem.title || "",
                              date: toInputDate(eventItem.date),
                              type: eventItem.type || "event",
                              tickets: eventItem.tickets || "Free",
                              rsvpCount: String(eventItem.rsvpCount ?? 0),
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-destructive/20 hover:bg-destructive hover:text-white px-2.5 py-1 text-xs font-semibold text-destructive transition-all"
                          onClick={() => removeByEndpoint(`/events/${eventItem._id}`, "Event")}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              {calendarEvents.filter((evt) => {
                const query = calendarSearch.toLowerCase();
                return (
                  (evt.title || "").toLowerCase().includes(query) ||
                  (evt.type || "").toLowerCase().includes(query)
                );
              }).length === 0 && (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  No calendar items match search criteria.
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
