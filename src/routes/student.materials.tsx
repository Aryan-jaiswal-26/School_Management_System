import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Film, File } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/module-shell";
import { fetchStudyMaterials } from "@/lib/homework-api";

export const Route = createFileRoute("/student/materials")({ component: Page });

const icons = { pdf: FileText, video: Film, doc: File, link: FileText };

function Page() {
  const [apiMaterials, setApiMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchStudyMaterials()
      .then((items) => {
        if (mounted) setApiMaterials(items || []);
      })
      .catch(() => {
        if (mounted) setApiMaterials([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const materials = apiMaterials;

  const handleDownload = (_id: string, title: string, url?: string) => {
    if (!url) {
      toast.error("Download Failed", { description: "No file attached to this material." });
      return;
    }
    
    // Convert absolute URLs from the database to relative paths so they hit the proxy
    let downloadUrl = url;
    if (url.includes("/uploads/")) {
      // The file is physically stored in the root of /uploads/ on the backend, 
      // even if the database URL includes a virtual folder like /study-materials/
      const parts = url.split("/");
      const filename = parts[parts.length - 1];
      downloadUrl = "/uploads/" + filename;
    } else if (!url.startsWith("http") && !url.startsWith("/")) {
      downloadUrl = `/${url}`;
    }

    // Create an invisible link to trigger the download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = title;
    link.target = "_blank"; // Open in new tab if browser blocks direct download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Downloading...", { description: title });
  };

  return (
    <div>
      <PageHeader title="Study Materials" subtitle="Download resources shared by your teachers" />
      {loading && <div className="text-sm text-muted-foreground">Loading materials…</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materials.map((m) => {
          const Icon = icons[m.type] || FileText;
          return (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{m.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.subject || m.subjectId || "General"} · {m.uploadedBy || "Teacher"} · {m.uploadDate || m.uploadedAt}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.size || "File"} · {(m.type || "pdf").toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDownload(m.id || m._id, m.title, m.fileUrl)}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 ${m.downloaded ? "border border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              >
                <Download className="h-4 w-4" />
                {m.downloaded ? "Downloaded" : "Download"}
              </button>
            </div>
          );
        })}
        {materials.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No materials"
            description="Your teachers haven't shared any materials yet."
          />
        )}
      </div>
    </div>
  );
}
