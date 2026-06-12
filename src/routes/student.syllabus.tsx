import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { BookOpen, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/student/syllabus")({ component: Page });

function Page() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabusModules, setSyllabusModules] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient<any>("/academics/subjects"),
      apiClient<any>("/academics/syllabus")
    ]).then(([subRes, sylRes]) => {
      setSubjects(subRes?.data || []);
      setSyllabusModules(sylRes?.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Syllabus" subtitle="Track curriculum progress across subjects" />
      <div className="space-y-4">
        {subjects.map((sub) => {
          const mods = syllabusModules.filter((m) => m.subjectId?._id === sub._id);
          const done = mods.filter((m) => m.completed).length;
          const progress = mods.length > 0 ? (done / mods.length) * 100 : 0;
          return (
            <Panel
              key={sub._id}
              title={sub.name}
              action={
                <span className="text-xs text-muted-foreground">
                  {done}/{mods.length} units
                </span>
              }
            >
              <div className="mb-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {mods.map((m) => (
                  <div
                    key={m._id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${m.completed ? "border-[oklch(0.65_0.15_155)]/30 bg-[oklch(0.65_0.15_155)]/5" : "border-border"}`}
                  >
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md mt-0.5 ${m.completed ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                    >
                      {m.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.unitName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {(m.topics || []).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
