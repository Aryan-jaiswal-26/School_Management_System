import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain,
  MessageSquare,
  Target,
  TrendingUp,
  Bell,
  FileText,
  Sparkles,
  BookOpen,
  Shield,
  CalendarDays,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";

export const Route = createFileRoute("/admin/ai-hub")({
  head: () => ({ meta: [{ title: "AI Hub · Campus OS" }] }),
  component: Page,
});

const modules = [
  {
    id: "AI-01",
    name: "Student Support Chatbot",
    owner: "Shaunak Paul",
    icon: MessageSquare,
    desc: "Intelligent chatbot preserving chat histories",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "AI-02",
    name: "Automated Grading",
    owner: "Aayush Patil",
    icon: Target,
    desc: "Auto-evaluate MCQs and short answers",
    color: "bg-green-500/10 text-green-600",
  },
  {
    id: "AI-03",
    name: "Attendance Analytics",
    owner: "Aayush Kushwaha",
    icon: TrendingUp,
    desc: "Predictive risk highlights for attendance",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "AI-04",
    name: "Performance Predictor",
    owner: "Sairaj Patil",
    icon: TrendingUp,
    desc: "Alert at-risk score tiers",
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "AI-05",
    name: "Smart Notifications",
    owner: "Shubham Lande",
    icon: Bell,
    desc: "Priority hub with channel toggles",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "AI-06",
    name: "Question Paper Generator",
    owner: "Phase 3",
    icon: FileText,
    desc: "Template builders for exams",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    id: "AI-07",
    name: "Adaptive Learning",
    owner: "Phase 3",
    icon: Sparkles,
    desc: "Personalized learning paths",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    id: "AI-08",
    name: "Career Guidance",
    owner: "Phase 3",
    icon: BookOpen,
    desc: "Career profile recommendations",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "AI-09",
    name: "Plagiarism Detector",
    owner: "Phase 3",
    icon: Shield,
    desc: "Similarity percentage meters",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "AI-10",
    name: "Smart Timetable",
    owner: "Phase 3",
    icon: CalendarDays,
    desc: "Collision checkers for scheduling",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

function Page() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="AI Hub"
        subtitle="Advanced AI modules for campus intelligence"
        actions={
          <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
            <Brain className="h-4 w-4" />
            10 Modules Active
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <div
            key={m.id}
            onClick={() => setActive(active === m.id ? null : m.id)}
            className={`rounded-xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${active === m.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">{m.id}</div>
                <div className="text-sm font-semibold">{m.name}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{m.desc}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">By {m.owner}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${m.owner === "Phase 3" ? "bg-muted text-muted-foreground" : "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"}`}
              >
                {m.owner === "Phase 3" ? "Upcoming" : "Active"}
              </span>
            </div>
            {active === m.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <div className="font-medium text-foreground mb-1">Module Details</div>
                  This AI module is{" "}
                  {m.owner === "Phase 3"
                    ? "scheduled for Phase 3 development"
                    : "currently active and processing data"}
                  . Click on individual role dashboards to interact with this module's features.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
