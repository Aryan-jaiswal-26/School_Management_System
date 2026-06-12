import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Wifi,
  WifiOff,
  CloudLightning,
  Sparkles,
  Languages,
  Check,
  RefreshCw,
  Trash2,
  HardDrive,
  Database,
  Key,
  Download,
  Upload,
} from "lucide-react";
import { PageHeader, StatCard, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "System Settings · Campus OS" }] }),
  component: AdvancedSettingsPage,
});

interface LanguageTranslation {
  welcome: string;
  attendance: string;
  fees: string;
  transport: string;
  canteen: string;
  health: string;
}

const translations: Record<string, LanguageTranslation> = {
  English: {
    welcome: "Welcome to your Academic Portal",
    attendance: "Student Attendance Tracker",
    fees: "Financial Fees Ledger",
    transport: "Fleet Bus GPS Tracking",
    canteen: "Canteen Mess Menu Planner",
    health: "Digital Health Infirmary",
  },
  Hindi: {
    welcome: "आपके शैक्षणिक पोर्टल में आपका स्वागत है",
    attendance: "छात्र उपस्थिति ट्रैकर",
    fees: "वित्तीय शुल्क बहीखाता",
    transport: "बस बेड़ा जीपीएस ट्रैकिंग",
    canteen: "कैंटीन मेस भोजन योजना",
    health: "डिजिटल स्वास्थ्य औषधालय",
  },
  Spanish: {
    welcome: "Bienvenido a su Portal Académico",
    attendance: "Rastreador de Asistencia Estudiantil",
    fees: "Libro de Tasas Financieras",
    transport: "Seguimiento GPS del Autobús de la Flota",
    canteen: "Planificador del Menú del Comedor",
    health: "Enfermería de Salud Digital",
  },
  Marathi: {
    welcome: "तुमच्या शैक्षणिक पोर्टलवर आपले स्वागत आहे",
    attendance: "विद्यार्थी उपस्थिती ट्रॅकर",
    fees: "वित्तीय फी लेजर",
    transport: "बस ताफा जीपीएस ट्रॅकिंग",
    canteen: "कॅन्टीन मेस मेनू प्लॅनर",
    health: "डिजिटल आरोग्य दवाखाना",
  },
  Arabic: {
    welcome: "مرحبًا بك في البوابة الأكاديمية الخاصة بك",
    attendance: "متابع حضور الطلاب",
    fees: "دفتر الرسوم المالية",
    transport: "تتبع الحافلات بجي بي إس",
    canteen: "مخطط قائمة الطعام بالمقصف",
    health: "العيادة الطبية الرقمية",
  },
};

type ThemePreset = "navy" | "crimson" | "emerald" | "amber";

type PermissionRecord = {
  _id: string;
  name: string;
  module: string;
  description?: string;
};

type RolePermissionRecord = {
  _id: string;
  name: string;
  description?: string;
  permissions?: PermissionRecord[];
};

function readStoredSetting(key: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  return localStorage.getItem(key) || fallback;
}

function AdvancedSettingsPage() {
  // Read existing mock states if any, or default
  const [networkState, setNetworkState] = useState<"Online" | "Offline">(() => {
    return readStoredSetting("mock_network_state", "Online") as "Online" | "Offline";
  });

  const [activeTheme, setActiveTheme] = useState<ThemePreset>(() => {
    return readStoredSetting("mock_theme_preset", "navy") as ThemePreset;
  });

  const [activeLang, setActiveLang] = useState<string>(() => {
    return readStoredSetting("mock_language", "English");
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheSize, setCacheSize] = useState("12.4 MB");
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [roles, setRoles] = useState<RolePermissionRecord[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState("SCHOOL_ADMIN");
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [rbacLoading, setRbacLoading] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const initialRoleNameRef = useRef(selectedRoleName);

  // Backup & API Key States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ _id: string; keyName: string; keyString: string; isActive: boolean }[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Sync effect for Mock Theme Presets
  const applyThemeClasses = (theme: ThemePreset) => {
    const root = document.documentElement;
    // Set simulated CSS custom variables on :root to shift HSL tokens in the view!
    if (theme === "navy") {
      root.style.setProperty("--accent", "221.2 83.2% 53.3%"); // Deep Blue HSL
      root.style.setProperty("--sidebar-primary", "222.2 47.4% 11.2%");
    } else if (theme === "crimson") {
      root.style.setProperty("--accent", "346.8 77.2% 49.8%"); // Rich Maroon HSL
      root.style.setProperty("--sidebar-primary", "355.7 100% 12%");
    } else if (theme === "emerald") {
      root.style.setProperty("--accent", "142.1 76.2% 36.3%"); // Forest Green HSL
      root.style.setProperty("--sidebar-primary", "150 60% 10%");
    } else if (theme === "amber") {
      root.style.setProperty("--accent", "37.9 90.2% 50.2%"); // Solar Amber HSL
      root.style.setProperty("--sidebar-primary", "25 70% 10%");
    }
  };

  useEffect(() => {
    applyThemeClasses(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    let isMounted = true;

    const loadRbac = async () => {
      try {
        setRbacLoading(true);
        const [permissionRes, roleRes] = await Promise.all([
          apiClient<PermissionRecord[]>("/rbac/permissions"),
          apiClient<RolePermissionRecord[]>("/rbac/roles"),
        ]);

        if (!isMounted) return;

        setPermissions(Array.isArray(permissionRes) ? permissionRes : []);
        const loadedRoles = Array.isArray(roleRes) ? roleRes : [];
        setRoles(loadedRoles);

        const initialRole =
          loadedRoles.find((role) => role.name === initialRoleNameRef.current) ?? loadedRoles[0];
        if (initialRole) {
          setSelectedRoleName(initialRole.name);
          setDraftPermissionIds(
            (initialRole.permissions || []).map((permission) => permission._id),
          );
        } else {
          setDraftPermissionIds([]);
        }
      } catch (error) {
        console.error("Failed to load RBAC data:", error);
        toast.error("Failed to load role permissions");
      } finally {
        if (isMounted) setRbacLoading(false);
      }
    };

    void loadRbac();

    const loadApiKeys = async () => {
      try {
        setLoadingKeys(true);
        const keys = await apiClient<any[]>("/api-keys");
        setApiKeys(Array.isArray(keys) ? keys : []);
      } catch (error) {
        console.error("Failed to load API keys:", error);
      } finally {
        setLoadingKeys(false);
      }
    };
    void loadApiKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const currentRole = roles.find((role) => role.name === selectedRoleName);
    setDraftPermissionIds((currentRole?.permissions || []).map((permission) => permission._id));
  }, [roles, selectedRoleName]);

  const permissionsByModule = useMemo(() => {
    return permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => {
      const key = permission.module || "GENERAL";
      (groups[key] ||= []).push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const activeRole = useMemo(
    () => roles.find((role) => role.name === selectedRoleName) || null,
    [roles, selectedRoleName],
  );

  const defaultRoleOptions = [
    { name: "SCHOOL_ADMIN" },
    { name: "TEACHER" },
    { name: "ACCOUNTANT" },
    { name: "DRIVER" },
    { name: "PARENT" },
    { name: "STUDENT" },
  ];

  const roleOptions = roles.length > 0 ? roles : defaultRoleOptions;

  const handleTogglePermission = (permissionId: string) => {
    setDraftPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((existingId) => existingId !== permissionId)
        : [...current, permissionId],
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleName) return;
    setSavingPermissions(true);
    try {
      const updatedRole = await apiClient<RolePermissionRecord>(
        `/rbac/roles/${selectedRoleName}/permissions`,
        {
          method: "PUT",
          data: { permissionIds: draftPermissionIds },
        },
      );
      setRoles((current) =>
        current.map((role) => (role.name === updatedRole.name ? updatedRole : role)),
      );
      toast.success(`${updatedRole.name} permissions updated successfully`);
    } catch (error) {
      console.error("Failed to save RBAC permissions:", error);
      toast.error("Unable to save role permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleNetwork = () => {
    const nextState = networkState === "Online" ? "Offline" : "Online";
    setNetworkState(nextState);
    localStorage.setItem("mock_network_state", nextState);

    if (nextState === "Offline") {
      toast.warning("Network connection severed (Simulated)", {
        description:
          "Application is now operating offline. All actions will be written to local SQLite mock cache.",
        duration: 4000,
      });
    } else {
      toast.success("Network connection restored (Simulated)", {
        description: "Back online! Synchronization pipeline is syncing changes to server.",
        duration: 4000,
      });
    }
  };

  const handleThemeChange = (theme: ThemePreset, label: string) => {
    setActiveTheme(theme);
    localStorage.setItem("mock_theme_preset", theme);
    toast.success(`Branded Theme Applied!`, {
      description: `Switched global theme environment to ${label} presets.`,
    });
  };

  const handleLanguageChange = (lang: string) => {
    setActiveLang(lang);
    localStorage.setItem("mock_language", lang);
    toast.success(`Language i18n Switched`, {
      description: `Active interface labels mapped to ${lang} dialect dictionary.`,
    });
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    toast.info("Connecting to secure synchronization gateways...", {
      description:
        "Uploading local CRUD tables, syncing transport geofences, and hostel utility registers.",
    });

    setTimeout(() => {
      setIsSyncing(false);
      setCacheSize("12.4 MB");
      toast.success("Synchronized successfully!", {
        description: "Local databases match the server ledger. 0 conflicts resolved.",
      });
    }, 2000);
  };

  const handleClearCache = () => {
    setCacheSize("0.0 KB");
    toast.error("Application local cache cleared", {
      description: "Simulated SQLite local db cache wiped out clean.",
    });
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return toast.error("Key name required");
    try {
      const newKey = await apiClient<any>("/api-keys", {
        method: "POST",
        data: { keyName: newKeyName }
      });
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
      toast.success("API Key generated");
    } catch (error) {
      toast.error("Failed to generate API Key");
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await apiClient(`/api-keys/${id}/revoke`, { method: "PUT" });
      setApiKeys(apiKeys.map(k => k._id === id ? { ...k, isActive: false } : k));
      toast.success("API Key revoked");
    } catch (error) {
      toast.error("Failed to revoke key");
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      await apiClient("/backup/trigger", { method: "POST" });
      toast.success("Database backup triggered successfully");
    } catch (error) {
      toast.error("Failed to trigger backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  // Quick lookup translation
  const trans = translations[activeLang] || translations.English;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus OS Advanced ERP Control Panel"
        subtitle="Manage offline caching parameters, brand customization presets, and global multi-language localization"
      />

      {/* Network & Settings Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Network Connection State"
          value={networkState === "Online" ? "ONLINE" : "OFFLINE CACHE"}
          icon={networkState === "Online" ? Wifi : WifiOff}
          tone={networkState === "Online" ? "success" : "warning"}
          delta="Click toggle below to simulate network loss"
        />
        <StatCard
          label="Local DB Cache Size"
          value={cacheSize}
          icon={HardDrive}
          tone="info"
          delta="SQLite simulated sandbox storage"
        />
        <StatCard
          label="Active i18n Language"
          value={activeLang}
          icon={Languages}
          tone="success"
          delta="Dynamic portal translations"
        />
        <StatCard
          label="Applied Accent Color"
          value={activeTheme.toUpperCase()}
          icon={Sparkles}
          tone="info"
          delta="Simulated active custom variables"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: Offline Cache & Sync controls */}
        <Panel title="PWA Offline Local Database & Network Synchronization">
          <div className="space-y-6 text-sm">
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                  {networkState === "Online" ? (
                    <Wifi className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                  ) : (
                    <WifiOff className="h-4.5 w-4.5 text-warning animate-bounce" />
                  )}
                  Network State Simulation Toggle
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Test page recovery under total connection loss. When offline, all CRUD entries
                  save inside the browser.
                </p>
              </div>
              <button
                onClick={handleToggleNetwork}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                  networkState === "Online"
                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white"
                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                }`}
              >
                {networkState === "Online" ? "Go Offline Mode" : "Restore Online State"}
              </button>
            </div>

            <div className="space-y-3">
              <div className="font-bold text-foreground">SQLite Diagnostics & Local Assets:</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="text-muted-foreground">Cached HTML/Assets</div>
                  <div className="font-bold text-[13px] text-foreground mt-1">52 files</div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="text-muted-foreground">Mock Sync Table Rows</div>
                  <div className="font-bold text-[13px] text-foreground mt-1">
                    428 rows (Local DB)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing && "animate-spin"}`} />
                {isSyncing ? "Synchronizing..." : "Sync Database Changes"}
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Local DB Cache
              </button>
            </div>
          </div>
        </Panel>

        {/* PANEL 2: Branded Accent Theme Customizer */}
        <Panel title="Accent Palette Theme Customizer (Branded HSL Presets)">
          <div className="space-y-5 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dynamically swap active colors between curated premium academies branding. Select
              below to shift colors instantly across all dashboard routes!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Preset 1: Navy Trust */}
              <button
                onClick={() => handleThemeChange("navy", "Navy Trust")}
                className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.02] ${
                  activeTheme === "navy"
                    ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-foreground flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />
                    Navy Trust
                  </div>
                  {activeTheme === "navy" && <Check className="h-4 w-4 text-blue-500" />}
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Deep collegiate blue. Sleek, secure, and professional campus environment.
                </div>
              </button>

              {/* Preset 2: Crimson Scholar */}
              <button
                onClick={() => handleThemeChange("crimson", "Crimson Scholar")}
                className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.02] ${
                  activeTheme === "crimson"
                    ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-foreground flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-rose-700" />
                    Crimson Scholar
                  </div>
                  {activeTheme === "crimson" && <Check className="h-4 w-4 text-rose-500" />}
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Ivy League Crimson. Elegant Maroon tones tailored with a scholar gold style.
                </div>
              </button>

              {/* Preset 3: Emerald Academy */}
              <button
                onClick={() => handleThemeChange("emerald", "Emerald Academy")}
                className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.02] ${
                  activeTheme === "emerald"
                    ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-foreground flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-600" />
                    Emerald Academy
                  </div>
                  {activeTheme === "emerald" && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Forest Academy. Rich sustainable green, relaxing for long administrative audits.
                </div>
              </button>

              {/* Preset 4: Amber Sunset */}
              <button
                onClick={() => handleThemeChange("amber", "Amber Sunset")}
                className={`p-4 rounded-xl border text-left space-y-2 transition-all hover:scale-[1.02] ${
                  activeTheme === "amber"
                    ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-foreground flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                    Amber Sunset
                  </div>
                  {activeTheme === "amber" && <Check className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Solar Amber. Warm sunrise orange hues providing visual vibrancy.
                </div>
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 3: Language i18n Translation Switcher */}
        <Panel title="i18n Multi-Language Translation Center">
          <div className="space-y-6 text-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <Languages className="h-4.5 w-4.5 text-accent" />
                  Select System Dialect Language
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Change active dictionary parameters. Updates database queries, notifications logs,
                  and widgets terminology labels.
                </p>
              </div>

              <select
                value={activeLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-10 w-48 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent font-semibold"
              >
                <option value="English">English (US / UK)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>

            {/* Simulated Live translation output preview */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3.5">
              <div className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                <CloudLightning className="h-3.5 w-3.5" />
                Simulated Live View Translations (Active preview):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2 border-b border-border/40">
                  <div className="text-[10px] text-muted-foreground">Portal Welcome Header:</div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">
                    {trans.welcome}
                  </div>
                </div>
                <div className="p-2 border-b border-border/40">
                  <div className="text-[10px] text-muted-foreground">
                    Attendance Tracker Widget:
                  </div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">
                    {trans.attendance}
                  </div>
                </div>
                <div className="p-2 border-b border-border/40">
                  <div className="text-[10px] text-muted-foreground">Fees & Finance Ledger:</div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">{trans.fees}</div>
                </div>
                <div className="p-2 border-b border-border/40">
                  <div className="text-[10px] text-muted-foreground">Bus Fleet GPS Tracker:</div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">
                    {trans.transport}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-muted-foreground">
                    Canteen Mess Menu Planner:
                  </div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">
                    {trans.canteen}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-muted-foreground">Digital Health Infirmary:</div>
                  <div className="font-semibold text-foreground text-xs mt-0.5">{trans.health}</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* PANEL 4: RBAC Role & Permission Customization */}
        <Panel title="Role-Based Access Control (RBAC) Permissions">
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure which permissions each school role can use. Changes are saved to the backend
              and immediately affect access checks.
            </p>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select Role
                </span>
                <select
                  value={selectedRoleName}
                  onChange={(event) => setSelectedRoleName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary sm:w-72"
                >
                  {roleOptions.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <div className="text-xs text-muted-foreground">
                {activeRole ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {activeRole.name.replaceAll("_", " ")}
                    </span>{" "}
                    has {draftPermissionIds.length} permission
                    {draftPermissionIds.length === 1 ? "" : "s"} selected.
                  </>
                ) : (
                  "No role loaded yet."
                )}
              </div>
            </div>

            {rbacLoading ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Loading permissions...
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(permissionsByModule).length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No permissions found in the backend.
                  </div>
                ) : (
                  Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <div key={module} className="rounded-xl border border-border bg-card">
                      <div className="border-b border-border px-4 py-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {module}
                        </div>
                      </div>
                      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {modulePermissions.map((permission) => {
                          const checked = draftPermissionIds.includes(permission._id);
                          return (
                            <label
                              key={permission._id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                checked
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border bg-background hover:bg-muted/40"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePermission(permission._id)}
                                className="mt-1 h-4 w-4 rounded border-border accent-primary"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">
                                  {permission.name}
                                </span>
                                {permission.description && (
                                  <span className="block text-xs text-muted-foreground">
                                    {permission.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions || rbacLoading}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {savingPermissions ? "Saving role permissions..." : "Save Role Permissions"}
              </button>
            </div>
          </div>
        </Panel>

        {/* PANEL 5: Backup & Restore */}
        <Panel title="Database Backup & Restore">
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manually trigger a full MongoDB database backup or restore from a previous archive.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isBackingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                {isBackingUp ? "Backing up..." : "Trigger Full Backup"}
              </button>
              <button
                onClick={() => toast.info("Restore UI opening...")}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-muted transition-all"
              >
                <Upload className="h-4 w-4 text-primary" />
                Restore Archive
              </button>
            </div>
          </div>
        </Panel>

        {/* PANEL 6: API Keys */}
        <Panel title="Developer API Keys">
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate API keys for third-party integrations to securely access the Campus OS REST API.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Key Name (e.g. Moodle Sync)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handleCreateApiKey}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Generate
              </button>
            </div>
            
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
              {loadingKeys ? (
                <div className="text-xs text-muted-foreground">Loading keys...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-xs text-muted-foreground">No API keys generated yet.</div>
              ) : (
                apiKeys.map(key => (
                  <div key={key._id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="font-bold text-xs text-foreground flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-accent" />
                        {key.keyName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">
                        {key.isActive ? key.keyString : "REVOKED"}
                      </div>
                    </div>
                    {key.isActive && (
                      <button onClick={() => handleRevokeKey(key._id)} className="text-xs text-destructive hover:underline font-semibold">
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
