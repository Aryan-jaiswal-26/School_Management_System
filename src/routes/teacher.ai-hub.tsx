import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Bot, User, Trash2, BookOpen, PenTool, Sparkles, HelpCircle } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const genId = () => Math.random().toString(36).substr(2, 9);

export const Route = createFileRoute("/teacher/ai-hub")({
  head: () => ({ meta: [{ title: "AI Assistant · Campus OS" }] }),
  component: Page,
});

const teacherBotResponses = [
  "Here is a draft lesson plan for Quadratic Equations:\n1. Hook: Show a throwing motion and plot its path.\n2. Concept: Standard form ax² + bx + c = 0.\n3. Activity: Solving by factorization.\n4. Exit ticket: Solve x² - 5x + 6 = 0.",
  "Based on Grade 10-A's performance, the average score is 82%. Geometry remains a slightly weaker area with an average of 74%. Would you like me to generate remedial worksheets?",
  "Draft email to Aarav's guardian:\n\nSubject: Update regarding Aarav's performance in Mathematics\n\nDear Parent, I am writing to share that Aarav has shown great improvement in algebra classes. However, his attendance has dipped to 72% recently. Let's connect to ensure he stays on track. Best regards, Anita Iyer.",
  "Remedial material recommendation: Focus on basic ratio properties before diving into complex Trigonometry proofs. I've prepared a 5-step practice sheet.",
  "Here are 3 exam questions for Algebra (Grade 10):\nQ1. Solve for x: 3x² - 12 = 0 (2 Marks)\nQ2. Find the roots of x² - 7x + 10 = 0 (3 Marks)\nQ3. Prove that the roots of the equation x² + px + q = 0 are real if p² >= 4q. (5 Marks)",
];

function Page() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [aiOutput, setAiOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = {
        id: genId(),
        role: "user",
        content: input,
        timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
        const botMsg = {
          id: genId(),
          role: "assistant",
          content: teacherBotResponses[Math.floor(Math.random() * teacherBotResponses.length)],
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const handleAiTool = (toolName: string, prompt: string) => {
    setLoadingAi(true);
    setAiOutput("");
    setTimeout(() => {
      setLoadingAi(false);
      if (toolName === "lesson") {
        setAiOutput(
          `**Generated Lesson Plan for: ${prompt}**\n\n**Objectives:** Understand key formulas, solve practical problems.\n**Duration:** 45 Mins\n\n**Structure:**\n• *Introduction (10 mins)*: Warm-up drill and real-world example.\n• *Direct Instruction (15 mins)*: Formulate equations and step-by-step solving demonstration.\n• *Guided Practice (15 mins)*: Class worksheet with peer help.\n• *Wrap-up (5 mins)*: Exit tickets to check understanding.`,
        );
      } else if (toolName === "exam") {
        setAiOutput(
          `**Draft Exam Questions for: ${prompt}**\n\n1. Explain the primary definition of ${prompt}. (3 Marks)\n2. Apply the theorem of ${prompt} to solve: y² + 4y - 12 = 0. (4 Marks)\n3. Advanced Case Study: In a real-world scenario, how does ${prompt} help engineers optimize structural designs? Describe with equations. (7 Marks)`,
        );
      } else {
        setAiOutput(
          `**Draft Notification / Parent Email**\n\nDear Parent/Guardian,\n\nI am writing to you regarding your ward's class performance in ${prompt}. We want to work together to ensure they achieve their full potential. Please review the attached progress feedback and let us know if we can schedule a virtual catch-up session.\n\nBest regards,\nAnita Iyer\nCampus OS Education Team`,
        );
      }
      toast.success("AI tool completed!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant Hub"
        subtitle="Access advanced AI assistants for drafting lessons, questions, and generating parent alerts."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat box column */}
        <div className="lg:col-span-2 space-y-4">
          <Panel
            title="Chat with Faculty AI"
            action={
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Chat
              </button>
            }
          >
            <div className="h-[420px] overflow-y-auto space-y-4 mb-4 pr-2 mt-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent mb-3">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div className="font-semibold">Hello, {user?.name || "Teacher"}! 👋</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Ask me to draft study guides, write parent letters, recommend remedial
                    materials, or query student data!
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}
                >
                  {m.role === "assistant" && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                  {m.role === "user" && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 border-t border-border pt-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI anything about your classes or subjects..."
                className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </Panel>
        </div>

        {/* Tools and Generator Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Panel title="Teacher AI Tools">
            <div className="space-y-3 mt-2">
              <button
                onClick={() => handleAiTool("lesson", "Probability & Dice Throws")}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Create Lesson Plan</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Topic: Probability & Dice
                    </p>
                  </div>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              </button>

              <button
                onClick={() => handleAiTool("exam", "Linear Equations (Grade 9)")}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Draft Exam Questions</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Linear Equations</p>
                  </div>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              </button>

              <button
                onClick={() => handleAiTool("nudge", "Mathematics")}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-green-500/10 p-2 text-green-500">
                    <PenTool className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Draft Parent Alert</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Draft progress notice
                    </p>
                  </div>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
              </button>
            </div>
          </Panel>

          {/* Generator output box */}
          {loadingAi || aiOutput ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3 animate-fade-in">
              <h4 className="font-semibold text-xs border-b border-border pb-1.5 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Generation Result
              </h4>
              {loadingAi ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  <span className="text-xs text-muted-foreground mt-2 font-medium">
                    Generating draft details...
                  </span>
                </div>
              ) : (
                <div className="text-xs leading-relaxed text-foreground bg-muted p-3 rounded-lg max-h-56 overflow-y-auto whitespace-pre-wrap font-medium">
                  {aiOutput}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
