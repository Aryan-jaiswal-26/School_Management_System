import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { fetchStudyMaterials, uploadStudyMaterial } from "@/lib/homework-api";
import {
  Search,
  FileText,
  Video,
  ExternalLink,
  Plus,
  BookOpen,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/teacher/materials")({
  head: () => ({ meta: [{ title: "Study Materials · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [file, setFile] = useState<File | null>(null);
  const [apiMaterials, setApiMaterials] = useState<any[]>([]);
  const [grade, setGrade] = useState("Grade 10");
  const [type, setType] = useState<"pdf" | "video" | "doc" | "link">("pdf");
  const [size, setSize] = useState("1.4 MB");

  useEffect(() => {
    let mounted = true;

    fetchStudyMaterials()
      .then((items) => {
        if (mounted) setApiMaterials(items || []);
      })
      .catch(() => {
        if (mounted) setApiMaterials([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const materials = apiMaterials.filter((m) => {
    const searchText = `${m.title || ""} ${m.subject || m.subjectId || ""}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesGrade = gradeFilter === "all" || (m.grade || m.classId) === gradeFilter;
    const matchesType = typeFilter === "all" || (m.type || "pdf") === typeFilter;
    return matchesSearch && matchesGrade && matchesType;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("className", grade);
      formData.append("subjectName", subject);
      formData.append("title", title);
      formData.append("description", `${subject} resource for ${grade}`);
      formData.append("category", type === "video" ? "VIDEO" : "NOTES");
      if (file) formData.append("file", file);

      await uploadStudyMaterial(formData);

      toast.success("Study material uploaded!", {
        description: `Added "${title}" under ${subject} (${grade}).`,
      });

      setTitle("");
      setFile(null);
      setShowAddForm(false);
      
      const newMaterials = await fetchStudyMaterials();
      setApiMaterials(newMaterials || []);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "link":
        return <ExternalLink className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        subtitle="Manage and distribute learning resources like PDFs, notes, lecture links, and videos."
        actions={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Upload Resource
          </button>
        }
      />

      {showAddForm && (
        <div className="max-w-xl animate-fade-in">
          <Panel title="Add New Study Resource">
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Calculus Introduction Slides"
                  required
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>History</option>
                    <option>English Lit</option>
                    <option>Computer Applications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Target Class
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option>Grade 10</option>
                    <option>Grade 9</option>
                    <option>Grade 8</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Resource Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="doc">Word/Doc Notes</option>
                    <option value="video">Video Lecture</option>
                    <option value="link">Web Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Optional File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {type !== "link" && type !== "video" && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      File Size
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 2.4 MB"
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Upload
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {/* Filter panel */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title or subject..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
        >
          <option value="all">All Grades</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 8">Grade 8</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
        >
          <option value="all">All Formats</option>
          <option value="pdf">PDF Files</option>
          <option value="doc">Word Docs</option>
          <option value="video">Videos</option>
          <option value="link">Links</option>
        </select>
      </div>

      {/* Materials grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {materials.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-border bg-card">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-semibold">No materials found</div>
            <div className="text-xs text-muted-foreground mt-1">
              Try refining your search or add a new resource.
            </div>
          </div>
        ) : (
          materials.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-accent/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg bg-muted p-2 group-hover:bg-accent/10 transition-colors">
                    {getIcon(item.type)}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {item.grade}
                  </span>
                </div>
                <h4 className="mt-3 font-semibold text-sm line-clamp-2 text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{item.subject}</span>
                  <span>•</span>
                  <span>{item.size}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.uploadDate}
                </span>
                <span className="font-medium text-foreground">
                  By {item.uploadedBy ? item.uploadedBy.split(" ")[0] : "Teacher"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
