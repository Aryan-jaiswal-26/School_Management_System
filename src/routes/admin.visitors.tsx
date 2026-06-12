import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  QrCode,
  ShieldBan,
  Send,
  CheckCircle,
  Clock,
  Printer,
  Ban,
  ShieldCheck,
  Search,
  Plus,
} from "lucide-react";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/visitors")({
  head: () => ({ meta: [{ title: "Visitor Management · Campus OS" }] }),
  component: VisitorsPage,
});

function VisitorsPage() {
  const [tab, setTab] = useState<"logs" | "preapproved" | "blacklist">("logs");
  const [showGatePass, setShowGatePass] = useState(false);
  const [search, setSearch] = useState("");

  const [logs, setLogs] = useState<any[]>([]);
  const [preApproved, setPreApproved] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [logsRes, preRes, blackRes] = await Promise.all([
        apiClient<any>("/visitors/logs"),
        apiClient<any>("/visitors/preapproved"),
        apiClient<any>("/visitors/blacklist")
      ]);
      setLogs(logsRes?.data || []);
      setPreApproved(preRes?.data || []);
      setBlacklist(blackRes?.data || []);
    } catch (err) {
      toast.error("Failed to load visitor data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckout = async (id: string) => {
    try {
      await apiClient(`/visitors/logs/${id}/checkout`, { method: "PUT" });
      toast.success("Visitor Checked Out successfully.");
      fetchData();
    } catch (err) {
      toast.error("Failed to checkout visitor");
    }
  };

  const handleNotifyHost = (host: string) => {
    toast.success(`Notification Sent to ${host}!`, {
      description: "SMS and App push notification dispatched to the teacher/host.",
    });
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.purpose?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor & Security Management"
        subtitle="Track entry logs, issue QR gate passes, and enforce campus blocklists."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Campus Visitors"
          value={String(logs.filter((l) => l.status === "Checked In").length)}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Total Pre-Approved"
          value={String(preApproved.length)}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Blacklisted Entries"
          value={String(blacklist.length)}
          icon={ShieldBan}
          tone="warning"
        />
        <StatCard label="Passes Issued Today" value="14" icon={QrCode} tone="success" />
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 max-w-md">
        {(
          [
            ["logs", "Live Entry Logs", Clock],
            ["preapproved", "Pre-Approved Passes", ShieldCheck],
            ["blacklist", "Security Blocklist", ShieldBan],
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

      {tab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel
              title="Campus Visitor Registry"
              action={
                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-accent"
                  />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Visitor Details</th>
                      <th className="pb-3 px-4">Host / Teacher</th>
                      <th className="pb-3 px-4">Time In</th>
                      <th className="pb-3 px-4">Time Out</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-foreground">{log.name}</div>
                          <div className="text-[10px] text-muted-foreground">{log.purpose}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{log.host}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{log.timeOut ? new Date(log.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              log.status === "Checked In"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                                : log.status === "Checked Out"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right space-x-2">
                          {log.status === "Checked In" && (
                            <>
                              <button
                                onClick={() => handleNotifyHost(log.host)}
                                className="rounded bg-accent/10 p-1.5 text-accent hover:bg-accent hover:text-white transition-all"
                                title="Notify Host"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCheckout(log.id)}
                                className="rounded bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                                title="Mark Checked Out"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
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
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Panel title="Generate Gate Pass (OTP/QR)">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate a secure digital gate pass for new visitors. The QR code will be sent to
                  their mobile via SMS.
                </p>
                <button
                  onClick={() => setShowGatePass(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <QrCode className="h-4 w-4" />
                  Create Digital Gate Pass
                </button>
              </div>
            </Panel>
            <Panel title="Security Alerts">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3 text-xs">
                <ShieldBan className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground mb-1">Strict Authentication</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Gate guards must scan the QR code or verify the OTP before granting physical
                    access to the premises.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "preapproved" && (
        <Panel
          title="Pre-Approved Parent / Relative List"
          action={
            <button className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add Approval
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preApproved.map((p) => (
              <div
                key={p._id || p.id}
                className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.relation}</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="pt-2 border-t border-border/50 flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground font-mono">Valid: {new Date(p.validUntil).toLocaleDateString()}</span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "blacklist" && (
        <Panel
          title="Campus Security Blocklist"
          action={
            <button className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline">
              <Ban className="h-3.5 w-3.5" /> Add to Blocklist
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blacklist.map((b) => (
              <div
                key={b._id || b.id}
                className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center gap-4"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <ShieldBan className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{b.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Reason: {b.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Added: {new Date(b.dateAdded).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Mock Gate Pass Modal */}
      {showGatePass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowGatePass(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border text-center"
          >
            <h3 className="font-bold text-lg mb-1">Gate Pass Generated</h3>
            <p className="text-xs text-muted-foreground mb-6">Pass #GP-28913 is ready</p>

            <div className="bg-muted p-4 border border-dashed border-border rounded-xl flex items-center justify-center mb-6">
              <QrCode className="h-40 w-40 text-foreground" />
            </div>

            <div className="space-y-1 mb-6">
              <div className="text-sm font-semibold">
                One-Time PIN: <span className="font-mono text-accent">8421</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Valid for today only.</div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => setShowGatePass(false)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> SMS Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
