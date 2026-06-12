import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Award,
  Medal,
  Star,
  GraduationCap,
  Download,
  Send,
  Plus,
  Printer,
  FileBadge2,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";

export const Route = createFileRoute("/admin/certificates")({
  head: () => ({ meta: [{ title: "Certificates & Achievements · Campus OS" }] }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const [tab, setTab] = useState<"certificates" | "scholarships" | "recognition">("certificates");

  const certificates = [
    {
      id: "c1",
      title: "Academic Excellence",
      student: "Aarav Sharma (10-B)",
      date: "May 25, 2026",
      status: "Issued",
    },
    {
      id: "c2",
      title: "Sports Participation - State Level",
      student: "Rohan Das (9-A)",
      date: "May 20, 2026",
      status: "Issued",
    },
    {
      id: "c3",
      title: "Perfect Attendance",
      student: "Riya Verma (8-C)",
      date: "Pending Generation",
      status: "Draft",
    },
  ];

  const scholarships = [
    {
      id: "s1",
      name: "Merit-Cum-Means Scholarship",
      student: "Kabir Singh",
      amount: "₹50,000",
      status: "Approved",
    },
    {
      id: "s2",
      name: "Sports Quota Grant",
      student: "Zara Khan",
      amount: "₹25,000",
      status: "Under Review",
    },
  ];

  const handleGenerate = () => {
    toast.success("Certificate Generation Triggered", {
      description:
        "PDFs are being generated in the background and will be emailed to students automatically.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates & Recognition"
        subtitle="Auto-generate achievement certificates, track scholarships, and publish Student of the Month."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Certificates Issued"
          value="1,204"
          icon={FileBadge2}
          tone="success"
          delta="This Year"
        />
        <StatCard label="Active Scholarships" value="45" icon={GraduationCap} tone="info" />
        <StatCard label="Pending Approvals" value="12" icon={Award} tone="warning" />
        <StatCard label="Total Scholarship Fund" value="₹12.5L" icon={Star} tone="success" />
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 max-w-md">
        {(
          [
            ["certificates", "Certificate Generator", FileBadge2],
            ["scholarships", "Scholarship Tracker", GraduationCap],
            ["recognition", "Student of the Month", Star],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all ${
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

      {tab === "certificates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel
              title="Recent Certificates"
              action={
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Batch Generate
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Certificate Details</th>
                      <th className="pb-3 px-4">Recipient</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pr-4 flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded bg-accent/10 text-accent">
                            <Award className="h-4 w-4" />
                          </div>
                          <span className="font-semibold">{cert.title}</span>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">{cert.student}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{cert.date}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              cert.status === "Issued"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                            }`}
                          >
                            {cert.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right space-x-2">
                          <button
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-1">
            <Panel title="Certificate Designer Preview">
              <div className="aspect-[1/1.4] rounded border-8 border-double border-accent/20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-amber-50 dark:bg-amber-950/20 p-6 flex flex-col items-center justify-between text-center relative shadow-inner">
                <Medal className="h-16 w-16 text-amber-500 mb-4 drop-shadow-md" />
                <div>
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-1 uppercase tracking-widest text-amber-900 dark:text-amber-500">
                    Certificate
                  </h3>
                  <p className="font-serif text-xs italic text-amber-800/80 dark:text-amber-600/80 mb-6">
                    of Achievement
                  </p>

                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    This is proudly presented to
                  </p>
                  <h2 className="font-serif text-xl font-bold text-foreground border-b border-accent/30 pb-1 mb-4 inline-block px-4">
                    [Student Name]
                  </h2>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
                    In recognition of outstanding performance and dedication in [Category] during
                    the academic year 2026.
                  </p>
                </div>

                <div className="flex justify-between w-full mt-8 px-4">
                  <div className="border-t border-accent/40 pt-1 text-[8px] font-bold uppercase tracking-wider">
                    Date Issued
                  </div>
                  <div className="border-t border-accent/40 pt-1 text-[8px] font-bold uppercase tracking-wider">
                    Principal Signature
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "scholarships" && (
        <Panel title="Scholarship Tracking Pipeline">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{s.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Awardee: <span className="font-medium text-foreground">{s.student}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    {s.amount}
                  </div>
                  <span
                    className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      s.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "recognition" && (
        <Panel title="Publish 'Student of the Month'">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 border border-amber-500/30 text-center">
              <div className="relative mb-4">
                <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-amber-500 overflow-hidden">
                  {/* Placeholder Image */}
                  <div className="w-full h-full bg-amber-500/20 flex items-center justify-center text-4xl">
                    👩‍🎓
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 shadow-lg">
                  <Star className="h-5 w-5 fill-white" />
                </div>
              </div>
              <h3 className="font-bold text-xl text-foreground">Ananya Iyer</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Grade 10-A
              </p>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed italic">
                "For exemplary leadership in the Science Fair and consistent academic excellence."
              </p>
            </div>

            <div className="flex-1 w-full space-y-4">
              <h4 className="font-bold text-sm">Select New Candidate</h4>
              <p className="text-xs text-muted-foreground">
                This will publish the achievement to the student's portfolio, send a push
                notification to their parents, and feature them on the school notice board feed.
              </p>

              <div className="space-y-3">
                <input
                  placeholder="Search Student Name..."
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
                <textarea
                  placeholder="Write citation..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
                />
                <button className="w-full bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" /> Publish Recognition
                </button>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
