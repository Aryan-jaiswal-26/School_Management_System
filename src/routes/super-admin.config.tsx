import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuperAdmin } from "@/components/super-admin/super-admin-context";
import {
  Sliders,
  ShieldAlert,
  FolderLock,
  Cpu,
  Clock,
  Gauge,
  Save,
  RefreshCw,
  HelpCircle,
  ToggleLeft,
  Server,
  KeyRound,
  AlertTriangle,
  Mail,
  Smartphone,
  MessageSquare,
  Lock,
  Globe,
  Link2,
  Database,
  Users,
  Copy,
} from "lucide-react";
import { Panel, PageHeader } from "@/components/module-shell";
import { ActionButton } from "@/components/page-ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── ROUTE DEFINITION ──
export const Route = createFileRoute("/super-admin/config")({
  component: SuperAdminConfig,
});

function SuperAdminConfig() {
  const { config, updateConfig, updateQuotas, schools } = useSuperAdmin();

  // Sub-tabs State: 'core' | 'communication' | 'integrations' | 'permissions'
  const [activeSubTab, setActiveSubTab] = useState<
    "core" | "communication" | "integrations" | "permissions"
  >("core");

  // Local Form state for Quotas
  const [quotasState, setQuotasState] = useState({
    storageLimitGB: config.quotas.storageLimitGB,
    maxUploadMB: config.quotas.maxUploadMB,
    sessionTimeoutMin: config.quotas.sessionTimeoutMin,
    rateThrottleLimit: config.quotas.rateThrottleLimit,
  });

  const [savingQuotas, setSavingQuotas] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Comm Gateways state
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.campus.os",
    port: 587,
    user: "notify@campus.os",
    pass: "••••••••",
  });
  const [smsConfig, setSmsConfig] = useState({
    provider: "Twilio",
    sid: "ACxxxxxxxxxxxxx",
    token: "••••••••",
  });
  const [badWordsFilter, setBadWordsFilter] = useState("cheat, spam, scam, fake, abuse");

  // Integrations state
  const [zoomConfig, setZoomConfig] = useState({
    clientId: "zoom_id_382910a",
    clientSecret: "••••••••",
  });
  const [webhookUrl, setWebhookUrl] = useState("https://api.schoolinstance.com/webhooks");
  const [ssoConfig, setSsoConfig] = useState({
    domain: "login.school.com",
    provider: "Google OAuth",
  });

  // Permissions state
  const [cloneSourceSchool, setCloneSourceSchool] = useState("");
  const [cloneTargetSchool, setCloneTargetSchool] = useState("");
  const [timeRestrictedAccess, setTimeRestrictedAccess] = useState({
    enabled: false,
    start: "08:00",
    end: "18:00",
  });

  // Handlers
  const handleToggleBeta = (flag: keyof typeof config.featureFlags) => {
    const current = config.featureFlags[flag];
    updateConfig({
      featureFlags: {
        ...config.featureFlags,
        [flag]: !current,
      },
    });
  };

  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ maintenanceMode: e.target.value as any });
  };

  const handleQuotasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuotas(true);
    setTimeout(() => {
      updateQuotas(quotasState);
      setSavingQuotas(false);
    }, 800);
  };

  const handleGeneralSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success("System Settings Synced", {
        description: "Timezone and Language defaults updated across core servers.",
      });
    }, 500);
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Communication Gateways Configured", {
      description: "SMTP mail server and Twilio SMS nodes successfully synchronized.",
    });
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Third-Party Integrations Synced", {
      description: "Zoom credentials, Webhook endpoints, and LMS settings committed successfully.",
    });
  };

  const handleClonePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceSchool || !cloneTargetSchool) {
      toast.error("Form incomplete", {
        description: "Please select both source and destination schools.",
      });
      return;
    }
    toast.success("Permissions Cloned Successfully!", {
      description: "Role permission templates cloned across multi-tenant scopes.",
    });
    setCloneSourceSchool("");
    setCloneTargetSchool("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Configuration & Feature Control Center"
        subtitle="Manage global toggle systems, configure gateway features, and manage integrations."
      />

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveSubTab("core")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "core"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Sliders className="h-4.5 w-4.5" /> Core Config
        </button>
        <button
          onClick={() => setActiveSubTab("communication")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "communication"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Mail className="h-4.5 w-4.5" /> Communication Gateways
        </button>
        <button
          onClick={() => setActiveSubTab("integrations")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "integrations"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Link2 className="h-4.5 w-4.5" /> Integration Hub & Webhooks
        </button>
        <button
          onClick={() => setActiveSubTab("permissions")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "permissions"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Lock className="h-4.5 w-4.5" /> Permissions Master
        </button>
      </div>

      {/* ── SUB-TAB RENDERERS ── */}

      {/* TAB 1: CORE CONFIG */}
      {activeSubTab === "core" && (
        <div className="space-y-6">
          {/* Warning Box for Maintenance Mode */}
          {config.maintenanceMode !== "None" && (
            <div className="flex gap-3 items-start p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 animate-in slide-in-from-top duration-300">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Active System Restriction Banner
                </h4>
                <p className="text-xs text-amber-200/80 mt-1 leading-normal">
                  Platform is currently running in{" "}
                  <strong className="text-white font-bold">
                    {config.maintenanceMode} Maintenance Mode
                  </strong>
                  . School portals will display server notice banners and restrict transactional
                  database queries.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              {/* MAINTENANCE & BETA FLAGS */}
              <Panel title="Control Settings & Feature Matrix">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Server className="h-4.5 w-4.5 text-indigo-400" /> Maintenance Mode Status
                      </label>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                          config.maintenanceMode === "None"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400",
                        )}
                      >
                        {config.maintenanceMode === "None" ? "Online" : "Restricted"}
                      </span>
                    </div>
                    <select
                      value={config.maintenanceMode}
                      onChange={handleMaintenanceChange}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none cursor-pointer focus:border-indigo-500"
                    >
                      <option value="None">None (All Portals Fully Operational)</option>
                      <option value="Partial">Partial (Academics Active, Finance Locked)</option>
                      <option value="Full">Full Maintenance (All Portals Blocked)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-4.5 w-4.5 text-indigo-400" /> Beta Modules Licensing Toggles
                    </label>
                    <div className="divide-y divide-border/60 border rounded-xl bg-muted/20 overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <div className="min-w-0 pr-4">
                          <h4 className="text-xs font-bold text-foreground">
                            AI Lesson Planner Hub
                          </h4>
                          <p className="text-[9px] text-muted-foreground leading-normal mt-0.5">
                            Allows teachers to compile syllabi automatically via Gemini nodes.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={config.featureFlags.aiPlanner}
                            onChange={() => handleToggleBeta("aiPlanner")}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div className="min-w-0 pr-4">
                          <h4 className="text-xs font-bold text-foreground">
                            Global SMS Alert Node
                          </h4>
                          <p className="text-[9px] text-muted-foreground leading-normal mt-0.5">
                            Enables targeted cell broadcasting for emergency updates.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={config.featureFlags.smsAlerts}
                            onChange={() => handleToggleBeta("smsAlerts")}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-indigo-500/25 bg-indigo-500/5 rounded-xl">
                    <div className="min-w-0 pr-4 flex gap-2.5 items-center">
                      <KeyRound className="h-5 w-5 text-indigo-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          Enforce Global 2FA Auth
                        </h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5 leading-normal">
                          Mandates Two-Factor Authentication for all portal logins.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={config.twoFactorEnforced}
                        onChange={(e) => updateConfig({ twoFactorEnforced: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>
                </div>
              </Panel>

              {/* LOCALIZATIONS */}
              <Panel title="Regional Settings & Localization">
                <form onSubmit={handleGeneralSettingsSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Default Server Timezone
                      </label>
                      <select
                        value={config.defaultTimezone}
                        onChange={(e) => updateConfig({ defaultTimezone: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer outline-none"
                      >
                        <option value="UTC">UTC (Coordinated Time)</option>
                        <option value="IST">IST (Indian Standard Time)</option>
                        <option value="PST">PST (Pacific Standard)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Default Language
                      </label>
                      <select
                        value={config.defaultLanguage}
                        onChange={(e) => updateConfig({ defaultLanguage: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer outline-none"
                      >
                        <option value="en">English (US Standard)</option>
                        <option value="hi">Hindi (India)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <ActionButton
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    >
                      Save Localizations
                    </ActionButton>
                  </div>
                </form>
              </Panel>
            </div>

            {/* QUOTAS */}
            <Panel title="System Quota Limits & Throttle Boundaries">
              <form onSubmit={handleQuotasSubmit} className="space-y-5">
                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/25 flex items-start gap-3">
                  <FolderLock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      Platform Boundaries Policy
                    </h4>
                    <p className="text-[9px] text-muted-foreground leading-normal mt-1">
                      Quotas defined below enforce hard limits on document attachments and server
                      requests.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Storage Limit per School (GB)
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      value={quotasState.storageLimitGB}
                      onChange={(e) =>
                        setQuotasState({
                          ...quotasState,
                          storageLimitGB: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-12 text-sm outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted border px-2 py-0.5 rounded">
                      GB
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Max File Upload Size (MB)
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      value={quotasState.maxUploadMB}
                      onChange={(e) =>
                        setQuotasState({
                          ...quotasState,
                          maxUploadMB: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-12 text-sm outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted border px-2 py-0.5 rounded">
                      MB
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Session Inactivity Timeout (Min)
                  </label>
                  <input
                    required
                    type="number"
                    value={quotasState.sessionTimeoutMin}
                    onChange={(e) =>
                      setQuotasState({
                        ...quotasState,
                        sessionTimeoutMin: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    API Rate Throttle limit (Reqs/Min)
                  </label>
                  <input
                    required
                    type="number"
                    value={quotasState.rateThrottleLimit}
                    onChange={(e) =>
                      setQuotasState({
                        ...quotasState,
                        rateThrottleLimit: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  />
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <ActionButton
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Save Quota Configurations
                  </ActionButton>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNICATION GATEWAYS */}
      {activeSubTab === "communication" && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-200">
          {/* SMTP AND EMAIL SERVER */}
          <Panel title="Email SMTP Server Gateway Configuration">
            <form onSubmit={handleSaveGateways} className="space-y-4 text-xs">
              <div className="bg-indigo-500/5 p-3.5 rounded-xl border border-indigo-500/25 flex items-start gap-2.5 text-indigo-200">
                <Mail className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px]">
                  Sets global outgoing SMTP parameters for automated transaction reports, alert
                  emails, and registrations.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  SMTP Outgoing Host
                </label>
                <input
                  required
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    SMTP Port
                  </label>
                  <input
                    required
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Secure SSL/TLS
                  </label>
                  <select className="h-10 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none">
                    <option value="STARTTLS">STARTTLS</option>
                    <option value="SSL">SSL</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  SMTP Username
                </label>
                <input
                  required
                  type="text"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  SMTP Password
                </label>
                <input
                  required
                  type="password"
                  value={smtpConfig.pass}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2 border-t flex justify-end">
                <ActionButton
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save SMTP Node
                </ActionButton>
              </div>
            </form>
          </Panel>

          {/* SMS AND CONTENT MODERATION */}
          <div className="space-y-6">
            <Panel title="SMS Broadcasting Gateways">
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                    SMS Service Provider
                  </label>
                  <select
                    value={smsConfig.provider}
                    onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer outline-none"
                  >
                    <option value="Twilio">Twilio Core Node</option>
                    <option value="MSG91">MSG91 India Node</option>
                    <option value="Infobip">Infobip Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Account SID / API Key
                  </label>
                  <input
                    type="text"
                    value={smsConfig.sid}
                    onChange={(e) => setSmsConfig({ ...smsConfig, sid: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("SMS credentials saved successfully.")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Save SMS Provider credentials
                </button>
              </div>
            </Panel>

            <Panel title="In-App Messaging & Content Moderation">
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Bad Words / Profanity Moderation Filters (Comma separated)
                  </label>
                  <textarea
                    rows={3}
                    value={badWordsFilter}
                    onChange={(e) => setBadWordsFilter(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card p-3 text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("Content moderation list compiled.")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Update Moderation Filters
                </button>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATION HUB */}
      {activeSubTab === "integrations" && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-200">
          {/* WEBHOOKS AND SSO */}
          <Panel title="Webhook Subscriptions & SSO Nodes">
            <form onSubmit={handleSaveIntegrations} className="space-y-5 text-xs">
              <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/25 flex items-start gap-2 text-indigo-200">
                <Sliders className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px]">
                  Configure third-party integrations and SSO (Single Sign-On) parameters for tenants
                  portals.
                </p>
              </div>

              {/* Webhook */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Global Webhook Endpoint URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                />
              </div>

              {/* SSO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    SSO Provider
                  </label>
                  <select
                    value={ssoConfig.provider}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, provider: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-2.5 text-xs cursor-pointer outline-none"
                  >
                    <option value="Google OAuth">Google Workspace</option>
                    <option value="Microsoft Entra">Microsoft Office 365</option>
                    <option value="SAML 2.0">SAML Custom Core</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    SSO domain authentication
                  </label>
                  <input
                    type="text"
                    value={ssoConfig.domain}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, domain: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Zoom Credentials */}
              <div className="space-y-1.5 border-t pt-3">
                <h5 className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">
                  Configure LMS & Third Party Classes Integration
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground">
                      Zoom Client ID
                    </label>
                    <input
                      type="text"
                      value={zoomConfig.clientId}
                      onChange={(e) => setZoomConfig({ ...zoomConfig, clientId: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground">
                      Zoom Client Secret
                    </label>
                    <input
                      type="password"
                      value={zoomConfig.clientSecret}
                      onChange={(e) =>
                        setZoomConfig({ ...zoomConfig, clientSecret: e.target.value })
                      }
                      className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <ActionButton
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Integrations
                </ActionButton>
              </div>
            </form>
          </Panel>

          {/* ACTIVE SCHOOL INTEGRATIONS STATUS */}
          <Panel title="Active School Integrations Health Board">
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 border border-border bg-card rounded-xl space-y-2.5 text-xs shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-foreground font-bold">{s.name}</strong>
                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase tracking-wide">
                      {s.plan}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/20 p-2 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zoom Sync:</span>
                      <strong
                        className={cn(
                          s.integrations.zoomEnabled ? "text-emerald-500" : "text-muted-foreground",
                        )}
                      >
                        {s.integrations.zoomEnabled ? "Active" : "Disabled"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SMTP Outbox:</span>
                      <strong
                        className={cn(
                          s.integrations.smtpConfigured
                            ? "text-emerald-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {s.integrations.smtpConfigured ? "Active" : "Disabled"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stripe checkout:</span>
                      <strong
                        className={cn(
                          s.integrations.stripeEnabled
                            ? "text-emerald-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {s.integrations.stripeEnabled ? "Active" : "Disabled"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Google Classroom:</span>
                      <strong
                        className={cn(
                          s.integrations.googleClassroomEnabled
                            ? "text-emerald-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {s.integrations.googleClassroomEnabled ? "Active" : "Disabled"}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 4: PERMISSIONS MASTER */}
      {activeSubTab === "permissions" && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-200">
          {/* DEFINE GLOBAL ROLES */}
          <Panel title="Global Roles & Permissions Master Design">
            <div className="space-y-4 text-xs">
              <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/25 flex items-start gap-2.5 text-indigo-200">
                <Users className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px]">
                  Define core system privileges globally. Individual tenants can override these
                  templates from their local admin settings.
                </p>
              </div>

              <div className="divide-y divide-border/60 border rounded-xl overflow-hidden bg-muted/10">
                {[
                  {
                    role: "School Admin",
                    desc: "Full administrative read/write control over single school instance, database rosters, and billing.",
                    privileges: "Root Instance Access",
                  },
                  {
                    role: "Teacher",
                    desc: "Renders lesson plans, records attendance rosters, publishes grade sheets, and message students/parents.",
                    privileges: "Academic read/write, Chat",
                  },
                  {
                    role: "Student",
                    desc: "Examines syllabus templates, submits assignments payloads, and view reports sheets.",
                    privileges: "Academic read-only, Chat",
                  },
                  {
                    role: "Parent",
                    desc: "Examines child attendances logs, pays fee invoice portals, and chat with teachers.",
                    privileges: "Academics child-linked read-only",
                  },
                ].map((item) => (
                  <div key={item.role} className="p-3.5 space-y-1">
                    <div className="flex justify-between">
                      <strong className="text-foreground font-bold">{item.role}</strong>
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {item.privileges}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* CLONE PERMISSIONS TOOL */}
          <div className="space-y-6">
            <Panel title="Clone Permissions Matrix across Tenants">
              <form onSubmit={handleClonePermissions} className="space-y-4 text-xs">
                <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/25 flex items-start gap-2 text-indigo-200">
                  <Copy className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px]">
                    Copy role definitions and modules privileges directly from a template source
                    school scope to target scopes.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Select Source Template School
                  </label>
                  <select
                    value={cloneSourceSchool}
                    onChange={(e) => setCloneSourceSchool(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-card px-2.5 text-xs cursor-pointer outline-none"
                  >
                    <option value="">Choose template source...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Select Target Destination School
                  </label>
                  <select
                    value={cloneTargetSchool}
                    onChange={(e) => setCloneTargetSchool(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-card px-2.5 text-xs cursor-pointer outline-none"
                  >
                    <option value="">Choose target deployment...</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Clone Permission Templates
                </button>
              </form>
            </Panel>

            {/* TIME BASED ACCESS LIMITS */}
            <Panel title="Time-Based Portal Restrictions">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-2 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                  <div className="flex gap-2 items-center">
                    <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold leading-none block">
                        Enforce Operational Hours restriction
                      </h4>
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        Restrict student portal access outside school hours
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={timeRestrictedAccess.enabled}
                      onChange={(e) =>
                        setTimeRestrictedAccess({
                          ...timeRestrictedAccess,
                          enabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>

                {timeRestrictedAccess.enabled && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">
                        Operational Start Hour
                      </label>
                      <input
                        type="time"
                        value={timeRestrictedAccess.start}
                        onChange={(e) =>
                          setTimeRestrictedAccess({
                            ...timeRestrictedAccess,
                            start: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">
                        Operational End Hour
                      </label>
                      <input
                        type="time"
                        value={timeRestrictedAccess.end}
                        onChange={(e) =>
                          setTimeRestrictedAccess({ ...timeRestrictedAccess, end: e.target.value })
                        }
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={() => toast.success("Operational hours parameters committed.")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                >
                  Save Restriction rules
                </button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
