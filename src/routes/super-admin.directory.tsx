import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuperAdmin, type School } from "@/components/super-admin/super-admin-context";
import {
  Building2,
  MapPin,
  List,
  Map,
  Plus,
  Settings,
  UserCheck,
  Ban,
  Trash2,
  MoreVertical,
  Globe,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  Percent,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  KeyRound,
  RotateCw,
  Clock,
  AlertTriangle,
  FolderLock,
  GraduationCap,
  Receipt,
  Download,
  Link as LinkIcon,
  HelpCircle,
  Check,
  X,
  Database,
  ShieldCheck,
  TrendingUp,
  Search,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PageHeader, EmptyState } from "@/components/module-shell";
import { StatusBadge, DataTable, TableHead, TableRow, ActionButton } from "@/components/page-ui";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── ROUTE DEFINITION ──
export const Route = createFileRoute("/super-admin/directory")({
  component: SuperAdminDirectory,
});

const AVAILABLE_MODULES = [
  "Academics",
  "Finance",
  "HR",
  "Library",
  "Clinic",
  "Transport",
  "Canteen",
  "AI Hub",
];
const SCHOOL_BOARDS = ["CBSE", "ICSE", "State", "IB", "Autonomous"];
const SCHOOL_TYPES = ["Primary", "Secondary", "College", "University"];

function SuperAdminDirectory() {
  const {
    schools,
    isMounted,
    createSchool,
    updateSchool,
    verifySchool,
    blacklistSchool,
    deleteSchool,
    impersonateSchool,
    extendTrialPeriod,
    processRefund,
    sendExpiryAlert,
    rotateApiKey,
  } = useSuperAdmin();

  // Sub-tabs State: 'instances' | 'billing' | 'academic' | 'data'
  const [activeSubTab, setActiveSubTab] = useState<"instances" | "billing" | "academic" | "data">(
    "instances",
  );

  // School instances states
  const [activeView, setActiveView] = useState<"list" | "map">("list");
  const [directoryTab, setDirectoryTab] = useState<"active" | "pending">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [boardFilter, setBoardFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inspectedSchoolId, setInspectedSchoolId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeRowDropdown, setActiveRowDropdown] = useState<string | null>(null);
  const [selectedConfigSchool, setSelectedConfigSchool] = useState<School | null>(null);

  // Create School Step wizard
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newSchoolData, setNewSchoolData] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    logoUrl: "",
    contact: "",
    website: "",
    plan: "Pro" as School["plan"],
    renewalDate: "",
    status: "Active" as School["status"],
    type: "Secondary" as School["type"],
    board: "IB" as School["board"],
    latitude: 38.0,
    longitude: -95.0,
    studentCount: 1200,
    teacherCount: 75,
    modules: ["Academics", "Library", "AI Hub"] as string[],
    taxEnabled: true,
    trialExtended: false,
    discountApplied: "",
  });

  const [editPlanData, setEditPlanData] = useState<{
    plan: School["plan"];
    renewalDate: string;
    modules: string[];
    taxEnabled: boolean;
    type: School["type"];
    board: School["board"];
  }>({
    plan: "Pro",
    renewalDate: "",
    modules: [],
    taxEnabled: true,
    type: "Secondary",
    board: "IB",
  });

  // Billing configurations states
  const [gstConfig, setGstConfig] = useState({ ratePercent: 18, taxOption: "Exclusive" });
  const [stripeConfig, setStripeConfig] = useState({ enabled: true, mode: "Live" });
  const [razorpayConfig, setRazorpayConfig] = useState({ enabled: true, mode: "Live" });

  // Academic oversight states
  const [underperformingThreshold, setUnderperformingThreshold] = useState(70);

  // Data states
  const [dbBackupHistory, setDbBackupHistory] = useState([
    {
      id: "bak-1",
      name: "CampusOS_Full_Backup_20260524.sql",
      size: "4.8 GB",
      created: "Yesterday",
      status: "Healthy",
    },
    {
      id: "bak-2",
      name: "CampusOS_Full_Backup_20260517.sql",
      size: "4.6 GB",
      created: "8 days ago",
      status: "Healthy",
    },
  ]);

  const inspectedSchool = useMemo(() => {
    return schools.find((s) => s.id === inspectedSchoolId) || null;
  }, [schools, inspectedSchoolId]);

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesVerification =
        directoryTab === "active" ? s.isVerified === true : s.isVerified === false;
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = planFilter === "ALL" || s.plan === planFilter;
      const matchesBoard = boardFilter === "ALL" || s.board === boardFilter;
      const matchesType = typeFilter === "ALL" || s.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

      return (
        matchesVerification &&
        matchesSearch &&
        matchesPlan &&
        matchesBoard &&
        matchesType &&
        matchesStatus
      );
    });
  }, [schools, directoryTab, searchQuery, planFilter, boardFilter, typeFilter, statusFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createStep === 1) {
      if (!newSchoolData.name || !newSchoolData.slug || !newSchoolData.adminEmail) {
        toast.error("Please fill in all general school fields.");
        return;
      }
      setCreateStep(2);
    } else {
      createSchool({
        ...newSchoolData,
        logoUrl:
          newSchoolData.logoUrl ||
          "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=80&fit=crop&q=60",
      });
      setShowCreateModal(false);
      setCreateStep(1);
    }
  };

  const handleEditPlanClick = (school: School) => {
    setSelectedConfigSchool(school);
    setEditPlanData({
      plan: school.plan,
      renewalDate: school.renewalDate,
      modules: [...school.modules],
      taxEnabled: school.taxEnabled,
      type: school.type,
      board: school.board,
    });
    setShowConfigModal(true);
    setActiveRowDropdown(null);
  };

  const handleEditPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigSchool) return;
    updateSchool(selectedConfigSchool.id, editPlanData);
    setShowConfigModal(false);
  };

  const handleApplyCoupon = (school: School) => {
    const coupon = prompt("Enter SaaS Discount Coupon Code (e.g. SAVE20, WINTER50):");
    if (!coupon) return;

    const amount = school.plan === "Basic" ? 1500 : school.plan === "Pro" ? 4500 : 9500;
    const discount = coupon.toUpperCase().includes("50") ? 0.5 : 0.2;
    const newInvoice = {
      id: `inv-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      amount: amount * (1 - discount),
      status: "Paid" as const,
      discountApplied: coupon.toUpperCase(),
    };

    updateSchool(school.id, {
      invoices: [newInvoice, ...school.invoices],
    });

    toast.success(`Discount Code Approved!`, {
      description: `Applied ${coupon.toUpperCase()} (${discount * 100}% off). New receipt ledger written.`,
    });
  };

  const handleTriggerBackup = () => {
    toast.loading("Compiling full database transaction schema...", {
      description: "Streaming snapshot to secure AWS S3 bucket.",
    });
    setTimeout(() => {
      toast.dismiss();
      const freshBackup = {
        id: `bak-${Math.random().toString(36).substr(2, 9)}`,
        name: `CampusOS_Full_Backup_${new Date().toISOString().split("T")[0].replace(/-/g, "")}.sql`,
        size: "4.9 GB",
        created: "Just now",
        status: "Healthy",
      };
      setDbBackupHistory([freshBackup, ...dbBackupHistory]);
      toast.success("Database Backup Complete", { description: "Snapshot locked and validated." });
    }, 2000);
  };

  const getCoordinates = (lat: number, lng: number) => {
    const minLat = 22;
    const maxLat = 52;
    const minLng = -128;
    const maxLng = -64;
    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 30;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 360 + 40;
    return { x, y };
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Tenant School Directory"
        subtitle="Manage cloud instances, customize SaaS subscriptions, approve registrations, and monitor system deployments."
        actions={
          <ActionButton
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 cursor-pointer shadow-md rounded-xl"
          >
            <Plus className="h-4.5 w-4.5" /> Deploy New School
          </ActionButton>
        }
      />

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveSubTab("instances")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "instances"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Building2 className="h-4 w-4" /> School Instances
        </button>
        <button
          onClick={() => setActiveSubTab("billing")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "billing"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Receipt className="h-4 w-4" /> Billing & Subscriptions
        </button>
        <button
          onClick={() => setActiveSubTab("academic")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "academic"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <GraduationCap className="h-4 w-4" /> Academic Oversight
        </button>
        <button
          onClick={() => setActiveSubTab("data")}
          className={cn(
            "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
            activeSubTab === "data"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Database className="h-4 w-4" /> Data Operations
        </button>
      </div>

      {/* ── SUB-TAB RENDERERS ── */}

      {/* TAB 1: SCHOOL INSTANCES */}
      {activeSubTab === "instances" && (
        <div className="space-y-6">
          {/* TAB PIPELINE active vs pending */}
          <div className="flex border-b border-border/80">
            <button
              onClick={() => {
                setDirectoryTab("active");
                setInspectedSchoolId(null);
              }}
              className={cn(
                "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                directoryTab === "active"
                  ? "border-indigo-600 text-indigo-500"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Active Deployments ({schools.filter((s) => s.isVerified).length})
            </button>
            <button
              onClick={() => {
                setDirectoryTab("pending");
                setInspectedSchoolId(null);
              }}
              className={cn(
                "px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                directoryTab === "pending"
                  ? "border-indigo-600 text-indigo-500"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Pending Approval Pipeline
              {schools.filter((s) => !s.isVerified).length > 0 && (
                <span className="h-4.5 w-4.5 grid place-items-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-pulse">
                  {schools.filter((s) => !s.isVerified).length}
                </span>
              )}
            </button>
          </div>

          {/* FILTERING AND GEOGRAPHIC VIEW SWITCHERS */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search schools directory…"
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-xs shadow-sm outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-2.5 text-xs outline-none cursor-pointer"
              >
                <option value="ALL">All Tiers</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>

              <select
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-2.5 text-xs outline-none cursor-pointer"
              >
                <option value="ALL">All Boards</option>
                {SCHOOL_BOARDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-2.5 text-xs outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                {SCHOOL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {directoryTab === "active" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-card px-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              )}
            </div>

            <div className="flex h-10 items-center rounded-xl bg-card border border-border p-1 shadow-sm shrink-0">
              <button
                onClick={() => setActiveView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer",
                  activeView === "list"
                    ? "bg-indigo-500/10 text-indigo-500 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" /> Grid view
              </button>
              <button
                onClick={() => setActiveView("map")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer",
                  activeView === "map"
                    ? "bg-indigo-500/10 text-indigo-500 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Map className="h-4 w-4" /> Geographic Map
              </button>
            </div>
          </div>

          {/* MAIN GRID VIEW */}
          {activeView === "list" ? (
            <Panel
              title={`${directoryTab === "active" ? "Active Schools Directory" : "Registration Review Pipeline"} (${filteredSchools.length} items)`}
            >
              {filteredSchools.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No school instances discovered"
                  description="No registered cloud tenants match your select filters."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/80">
                  <DataTable>
                    <TableHead>
                      <th className="px-4 py-3 text-left">Deploy Details</th>
                      <th className="px-4 py-3 text-left">School Board</th>
                      <th className="px-4 py-3 text-left">School Type</th>
                      <th className="px-4 py-3 text-left">SaaS Tier</th>
                      <th className="px-4 py-3 text-left">Renewal Cycle</th>
                      <th className="px-4 py-3 text-left">Platform Health</th>
                      <th className="w-12 px-4 py-3 text-center">Config</th>
                    </TableHead>
                    <tbody>
                      {filteredSchools.map((s) => {
                        const statusTones = {
                          Active: "success",
                          Suspended: "warning",
                          Blacklisted: "danger",
                        } as const;
                        const planTones = {
                          Basic: "neutral",
                          Pro: "info",
                          Enterprise: "success",
                        } as const;
                        return (
                          <TableRow key={s.id}>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={s.logoUrl}
                                  alt="logo"
                                  className="h-9 w-9 shrink-0 rounded-lg object-cover border"
                                />
                                <div>
                                  <button
                                    onClick={() => setInspectedSchoolId(s.id)}
                                    className="font-semibold text-foreground text-sm hover:text-indigo-500 hover:underline text-left cursor-pointer"
                                  >
                                    {s.name}
                                  </button>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex gap-2">
                                    <span>Code: {s.slug}</span>
                                    <span>·</span>
                                    <span>UID: {s.id.substring(0, 8)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase">
                              {s.board}
                            </td>
                            <td className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                              {s.type}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge tone={planTones[s.plan]}>{s.plan}</StatusBadge>
                            </td>
                            <td className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                              {s.renewalDate}
                            </td>
                            <td className="px-4 py-4">
                              {directoryTab === "active" ? (
                                <StatusBadge tone={statusTones[s.status]}>{s.status}</StatusBadge>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-500 uppercase tracking-wide animate-pulse">
                                  Pending Approval
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() =>
                                    setActiveRowDropdown((prev) => (prev === s.id ? null : s.id))
                                  }
                                  className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                                >
                                  <MoreVertical className="h-4.5 w-4.5" />
                                </button>
                                {activeRowDropdown === s.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setActiveRowDropdown(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-50 py-1.5 divide-y divide-border/40 animate-in fade-in duration-150">
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setInspectedSchoolId(s.id);
                                            setActiveRowDropdown(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted text-left cursor-pointer font-medium"
                                        >
                                          <Building2 className="h-4 w-4 text-indigo-400" /> Inspect
                                          Profile Details
                                        </button>
                                        {directoryTab === "pending" ? (
                                          <button
                                            onClick={() => {
                                              verifySchool(s.id);
                                              setActiveRowDropdown(null);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-500 hover:bg-emerald-500/10 text-left font-bold cursor-pointer"
                                          >
                                            <CheckCircle className="h-4 w-4" /> Verify & Approve
                                            Deployment
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => handleEditPlanClick(s)}
                                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted text-left cursor-pointer font-medium"
                                            >
                                              <Settings className="h-4 w-4 text-indigo-400" />{" "}
                                              Configure Subscription
                                            </button>
                                            <button
                                              onClick={() => {
                                                impersonateSchool(s.id, s.name);
                                                setActiveRowDropdown(null);
                                                window.location.href = "/admin";
                                              }}
                                              disabled={s.status !== "Active"}
                                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted text-left disabled:opacity-40 cursor-pointer font-medium"
                                            >
                                              <UserCheck className="h-4 w-4 text-emerald-400" />{" "}
                                              Impersonate Admin
                                            </button>
                                            <button
                                              onClick={() => {
                                                handleApplyCoupon(s);
                                                setActiveRowDropdown(null);
                                              }}
                                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted text-left cursor-pointer font-medium"
                                            >
                                              <Percent className="h-4 w-4 text-amber-500" /> Apply
                                              Discount Coupon
                                            </button>
                                          </>
                                        )}
                                      </div>
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            blacklistSchool(s.id);
                                            setActiveRowDropdown(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 text-left font-bold cursor-pointer"
                                        >
                                          <Ban className="h-4 w-4" />{" "}
                                          {s.status === "Blacklisted"
                                            ? "Activate Deployment"
                                            : "Blacklist School"}
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (
                                              confirm(
                                                "Are you absolutely sure you want to permanently delete and purge school records?",
                                              )
                                            ) {
                                              deleteSchool(s.id);
                                            }
                                            setActiveRowDropdown(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-600/10 text-left font-bold cursor-pointer"
                                        >
                                          <Trash2 className="h-4 w-4" /> Delete & Archive
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </DataTable>
                </div>
              )}
            </Panel>
          ) : (
            /* MAP VIEW */
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Cloud Instance Geographical Map" className="lg:col-span-2">
                <div className="relative h-[380px] w-full rounded-xl bg-slate-900 border overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                  <svg
                    viewBox="0 0 800 450"
                    className="h-full w-full opacity-30 select-none"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={1}
                  >
                    <polygon
                      points="120,80 180,85 240,65 300,75 350,60 410,75 490,45 560,50 620,70 660,60 740,75 760,110 745,180 770,240 730,280 745,340 710,380 620,360 550,375 480,365 420,380 340,365 280,390 200,380 180,345 120,355 90,320 80,260 50,220 85,180 100,120"
                      fill="url(#mapGrad)"
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <defs>
                      <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1e1b4b" />
                        <stop offset="100%" stopColor="#020617" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {filteredSchools.map((s) => {
                    const { x, y } = getCoordinates(s.latitude, s.longitude);
                    const pinColors = {
                      Active: "fill-emerald-500 stroke-emerald-100",
                      Suspended: "fill-amber-500 stroke-amber-100",
                      Blacklisted: "fill-rose-500 stroke-rose-100",
                    };
                    return (
                      <button
                        key={s.id}
                        onClick={() => setInspectedSchoolId(s.id)}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-6 w-6 rounded-full bg-indigo-500 animate-ping opacity-60 scale-75" />
                          <MapPin
                            className={cn(
                              "h-6.5 w-6.5 transition-transform duration-200 group-hover:scale-125 drop-shadow-md",
                              pinColors[s.status],
                            )}
                          />
                          <span className="pointer-events-none absolute bottom-full mb-1 bg-slate-950 px-2 py-0.5 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 border rounded shadow-xl">
                            {s.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Geographic Scope Log">
                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-3">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <h4 className="font-semibold text-foreground text-xs">Geographical Scope Log</h4>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed mx-auto">
                    Choose pins on the vector map or click on listed school names to launch the
                    inspector profile drawers.
                  </p>
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BILLING & SUBSCRIPTIONS */}
      {activeSubTab === "billing" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* PRICING PLANS CONFIGURATION */}
            <div className="md:col-span-2 space-y-6">
              <Panel title="Cloud Subscriptions & Plan Tiers Matrix">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <DataTable>
                    <TableHead>
                      <th className="px-4 py-3 text-left">Plan Name</th>
                      <th className="px-4 py-3 text-left">Monthly Rate</th>
                      <th className="px-4 py-3 text-left">Quotas Allowed</th>
                      <th className="px-4 py-3 text-left">Module-level Gates</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </TableHead>
                    <tbody>
                      {[
                        {
                          name: "Basic",
                          rate: "$150/mo",
                          quotas: "200 Students, 20 Teachers, 10GB",
                          modules: "Academics, Library",
                        },
                        {
                          name: "Pro",
                          rate: "$450/mo",
                          quotas: "500 Students, 50 Teachers, 50GB",
                          modules: "Academics, Finance, HR, Transport, AI Hub",
                        },
                        {
                          name: "Enterprise",
                          rate: "$950/mo",
                          quotas: "Unlimited Limits, 250GB",
                          modules: "All Core Modules + SSO Custom Webhooks",
                        },
                      ].map((p, idx) => (
                        <TableRow key={p.name}>
                          <td className="px-4 py-3.5 font-bold text-xs text-foreground">
                            {p.name}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-indigo-500 font-bold">
                            {p.rate}
                          </td>
                          <td className="px-4 py-3.5 text-[10px] text-muted-foreground">
                            {p.quotas}
                          </td>
                          <td className="px-4 py-3.5 text-[10px] text-muted-foreground">
                            {p.modules}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                              Active Matrix
                            </span>
                          </td>
                        </TableRow>
                      ))}
                    </tbody>
                  </DataTable>
                </div>
              </Panel>

              {/* PAYMENT LEDGER PER SCHOOL */}
              <Panel title="SaaS Schools Transactional History Ledger">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <DataTable>
                    <TableHead>
                      <th className="px-4 py-3 text-left">Invoice UUID</th>
                      <th className="px-4 py-3 text-left">School Client</th>
                      <th className="px-4 py-3 text-left">Captured Date</th>
                      <th className="px-4 py-3 text-left">Base Amount</th>
                      <th className="px-4 py-3 text-left">Coupon applied</th>
                      <th className="px-4 py-3 text-center">State Ledger</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </TableHead>
                    <tbody>
                      {schools.flatMap((s) =>
                        s.invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">
                              {inv.id.substring(0, 12)}...
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold">{s.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{inv.date}</td>
                            <td className="px-4 py-3 text-xs font-bold">${inv.amount}</td>
                            <td className="px-4 py-3">
                              {inv.discountApplied ? (
                                <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {inv.discountApplied}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/35">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge
                                tone={
                                  inv.status === "Paid"
                                    ? "success"
                                    : inv.status === "Refunded"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {inv.status}
                              </StatusBadge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => processRefund(s.id, inv.id)}
                                  disabled={inv.status === "Refunded"}
                                  title="Process Refund"
                                  className="text-[10px] text-rose-500 font-bold bg-rose-500/5 hover:bg-rose-500/15 disabled:opacity-40 px-2 py-1 rounded cursor-pointer"
                                >
                                  Refund
                                </button>
                                <button
                                  onClick={() => toast.success("PDF receipt dispatched to inbox.")}
                                  title="Download receipt PDF"
                                  className="text-[10px] text-indigo-500 font-bold bg-indigo-500/5 hover:bg-indigo-500/15 px-2 py-1 rounded cursor-pointer"
                                >
                                  PDF
                                </button>
                              </div>
                            </td>
                          </TableRow>
                        )),
                      )}
                    </tbody>
                  </DataTable>
                </div>
              </Panel>
            </div>

            {/* QUICK ACTIONS & CONFIGURATIONS */}
            <div className="space-y-6">
              {/* TAX & GATEWAY CONFIG */}
              <Panel title="Tax & Gateway Configurations">
                <div className="space-y-4 text-xs">
                  {/* Tax Option */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      GST / Tax Configuration
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={gstConfig.taxOption}
                        onChange={(e) => setGstConfig({ ...gstConfig, taxOption: e.target.value })}
                        className="h-10 flex-1 rounded-lg border border-border bg-card px-2 text-xs cursor-pointer outline-none"
                      >
                        <option value="Exclusive">Exclusive GST (18%)</option>
                        <option value="Inclusive">Inclusive GST</option>
                        <option value="None">Tax Exempt</option>
                      </select>
                      <input
                        type="number"
                        value={gstConfig.ratePercent}
                        onChange={(e) =>
                          setGstConfig({
                            ...gstConfig,
                            ratePercent: parseInt(e.target.value) || 18,
                          })
                        }
                        className="h-10 w-16 border rounded-lg text-center"
                      />
                    </div>
                  </div>

                  {/* Gateways Toggle */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Configure Payment Gateways
                    </h5>
                    <div className="flex items-center justify-between p-2.5 border rounded-xl bg-muted/10">
                      <div>
                        <strong className="text-foreground text-xs leading-none block font-bold">
                          Stripe Integration
                        </strong>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          International Gateway (USD)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={stripeConfig.enabled}
                          onChange={(e) =>
                            setStripeConfig({ ...stripeConfig, enabled: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-2.5 border rounded-xl bg-muted/10">
                      <div>
                        <strong className="text-foreground text-xs leading-none block font-bold">
                          Razorpay India
                        </strong>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          UPI, Cards & NetBanking (INR)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={razorpayConfig.enabled}
                          onChange={(e) =>
                            setRazorpayConfig({ ...razorpayConfig, enabled: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                      </label>
                    </div>
                  </div>
                  <ActionButton
                    onClick={() => toast.success("Gateway parameters synchronized.")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Save Gateway Policies
                  </ActionButton>
                </div>
              </Panel>

              {/* QUICK LICENSE ACTIONS */}
              <Panel title="SaaS License Quick Actions">
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
                  {schools.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 border border-border bg-card rounded-xl space-y-2 text-xs shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="text-foreground font-bold">{s.name}</strong>
                        <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {s.plan}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Cycle Expiry:</span>
                        <strong className="text-foreground">{s.renewalDate}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => extendTrialPeriod(s.id)}
                          className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white font-bold text-[9px] py-1.5 rounded transition-all cursor-pointer text-center uppercase border border-indigo-500/10"
                        >
                          +30d Extend
                        </button>
                        <button
                          onClick={() => sendExpiryAlert(s.id)}
                          className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white font-bold text-[9px] py-1.5 rounded transition-all cursor-pointer text-center uppercase border border-amber-500/10"
                        >
                          Send Alert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC OVERSIGHT */}
      {activeSubTab === "academic" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* OVERSIGHT MATRIX COMPARISON */}
            <div className="md:col-span-2 space-y-6">
              <Panel title="Cross-School Academic Oversight & Health Flagger">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <DataTable>
                    <TableHead>
                      <th className="px-4 py-3 text-left">School Scope</th>
                      <th className="px-4 py-3 text-left">Board</th>
                      <th className="px-4 py-3 text-center">Avg Attendance</th>
                      <th className="px-4 py-3 text-center">Exam Result Index</th>
                      <th className="px-4 py-3 text-center">Fee Collection Status</th>
                      <th className="px-4 py-3 text-center">Oversight Flagger</th>
                    </TableHead>
                    <tbody>
                      {schools.map((s, idx) => {
                        // mock some stats based on school plan/index
                        const attendances = [92, 88, 72, 64, 95];
                        const results = [84, 76, 68, 55, 91];
                        const fees = [95, 82, 60, 45, 98];

                        const attendance = attendances[idx % attendances.length]!;
                        const result = results[idx % results.length]!;
                        const fee = fees[idx % fees.length]!;

                        const isUnderperforming =
                          attendance < underperformingThreshold ||
                          result < underperformingThreshold;
                        return (
                          <TableRow key={s.id}>
                            <td className="px-4 py-3.5 font-bold text-xs">{s.name}</td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground uppercase">
                              {s.board}
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-xs">
                              {attendance}%
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-xs">
                              {result}/100
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="w-24 mx-auto bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    fee > 80
                                      ? "bg-emerald-500"
                                      : fee > 50
                                        ? "bg-amber-500"
                                        : "bg-rose-500",
                                  )}
                                  style={{ width: `${fee}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground font-bold mt-0.5 block">
                                {fee}% Collected
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {isUnderperforming ? (
                                <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-500 uppercase tracking-wide animate-pulse">
                                  Flagged Alert
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                                  Optimal Scope
                                </span>
                              )}
                            </td>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </DataTable>
                </div>
              </Panel>
            </div>

            {/* CONFIGURATIONS & CRITERIA */}
            <div className="space-y-6">
              <Panel title="Oversight Alarm Thresholds">
                <div className="space-y-4 text-xs">
                  <div className="bg-rose-500/5 border border-rose-500/25 p-3 rounded-xl flex items-start gap-2.5 text-rose-200">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px]">
                      Flag underperforming schools automatically if their attendance or exam grade
                      index drops below configured thresholds.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Academic Alert Threshold (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={50}
                        max={95}
                        value={underperformingThreshold}
                        onChange={(e) =>
                          setUnderperformingThreshold(parseInt(e.target.value) || 70)
                        }
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 pr-10 text-xs outline-none focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  <ActionButton
                    onClick={() =>
                      toast.success("Academic oversight thresholds committed to memory.")
                    }
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Save Alarm Policies
                  </ActionButton>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA OPERATIONS */}
      {activeSubTab === "data" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* DATABASE BACKUP HISTORY */}
            <div className="md:col-span-2 space-y-6">
              <Panel title="Cloud Core Snapshot Backups (Full schema + users tables)">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Snapshot storage: AWS S3 secure vault
                    </h5>
                    <button
                      onClick={handleTriggerBackup}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Trigger Database Backup
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <DataTable>
                      <TableHead>
                        <th className="px-4 py-3 text-left">SQL File Name</th>
                        <th className="px-4 py-3 text-left">Size Bytes</th>
                        <th className="px-4 py-3 text-left">Generated Created</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Operations</th>
                      </TableHead>
                      <tbody>
                        {dbBackupHistory.map((bak) => (
                          <TableRow key={bak.id}>
                            <td className="px-4 py-3.5 font-mono text-[10px] text-foreground font-bold">
                              {bak.name}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {bak.size}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {bak.created}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <StatusBadge tone="success">{bak.status}</StatusBadge>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() =>
                                    toast.success(`Restoring database to checkpoint: ${bak.name}`)
                                  }
                                  className="text-[10px] text-rose-500 font-bold bg-rose-500/5 hover:bg-rose-500/15 px-2 py-1 rounded cursor-pointer"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => toast.success("SQL download initiated.")}
                                  className="text-[10px] text-indigo-500 font-bold bg-indigo-500/5 hover:bg-indigo-500/15 px-2 py-1 rounded cursor-pointer"
                                >
                                  Download
                                </button>
                              </div>
                            </td>
                          </TableRow>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                </div>
              </Panel>
            </div>

            {/* DATA MANAGEMENT CONTROLS */}
            <div className="space-y-6">
              {/* GDPR COMPLIANCE */}
              <Panel title="GDPR & Data Compliance Policies">
                <div className="space-y-4 text-xs">
                  <div className="bg-indigo-500/5 border border-indigo-500/25 p-3 rounded-xl flex items-start gap-2.5 text-indigo-200">
                    <FolderLock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-white text-xs">Retention policy settings</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        Configure global data purge thresholds for deleted school accounts.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Data Retention Period (Days)
                    </label>
                    <select className="h-10 w-full rounded-lg border border-border bg-card px-2 text-xs outline-none">
                      <option value="30">30 days after deletion</option>
                      <option value="60">60 days after deletion (Grace limit)</option>
                      <option value="90">90 days after deletion</option>
                      <option value="0">Purge instantly (No backup retention)</option>
                    </select>
                  </div>

                  <ActionButton
                    onClick={() => toast.success("GDPR retention policies committed.")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Save GDPR Policies
                  </ActionButton>
                </div>
              </Panel>

              {/* PLATFORM BULK IMPORTS */}
              <Panel title="Platform Bulk Imports & Migration">
                <div className="space-y-3.5 text-xs">
                  <div className="border border-dashed border-border p-4 rounded-xl text-center bg-card/40 space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground/35 mx-auto" />
                    <div>
                      <button
                        onClick={() =>
                          toast.success("CSV/Excel master import matrix parsed successfully.")
                        }
                        className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                      >
                        Upload CSV / Excel sheets
                      </button>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Bulk import schools, teachers or students rosters immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* CREATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <form
            onSubmit={handleCreateSubmit}
            className="relative w-full max-w-lg bg-card border rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-foreground">Deploy School instance</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm font-bold bg-muted px-2.5 py-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {createStep === 1 ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      School Legal Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Oakwood Academy"
                      value={newSchoolData.name}
                      onChange={(e) =>
                        setNewSchoolData({
                          ...newSchoolData,
                          name: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Unique Slug Code
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="oakwood-academy"
                      value={newSchoolData.slug}
                      onChange={(e) => setNewSchoolData({ ...newSchoolData, slug: e.target.value })}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Principal Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="principal@school.com"
                      value={newSchoolData.adminEmail}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, adminEmail: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                    />
                  </div>
                  <div className="flex justify-end pt-3">
                    <Button
                      type="button"
                      onClick={() => setCreateStep(2)}
                      className="rounded-xl px-5 gap-1"
                    >
                      Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        School Type
                      </label>
                      <select
                        value={newSchoolData.type}
                        onChange={(e) =>
                          setNewSchoolData({ ...newSchoolData, type: e.target.value as any })
                        }
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer"
                      >
                        {SCHOOL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Board
                      </label>
                      <select
                        value={newSchoolData.board}
                        onChange={(e) =>
                          setNewSchoolData({ ...newSchoolData, board: e.target.value as any })
                        }
                        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer"
                      >
                        {SCHOOL_BOARDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      SaaS Pricing Plan
                    </label>
                    <select
                      value={newSchoolData.plan}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, plan: e.target.value as any })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer"
                    >
                      <option value="Basic">Basic ($150/mo)</option>
                      <option value="Pro">Pro ($450/mo)</option>
                      <option value="Enterprise">Enterprise ($950/mo)</option>
                    </select>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="text-xs text-muted-foreground font-bold hover:underline cursor-pointer"
                    >
                      Back
                    </button>
                    <Button type="submit" className="rounded-xl px-5">
                      Deploy Instance
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* EDIT CONFIG SUBSCRIPTION MODAL */}
      {showConfigModal && selectedConfigSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />
          <form
            onSubmit={handleEditPlanSubmit}
            className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-foreground">
                Configure Subscription Details
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-sm font-bold bg-muted px-2.5 py-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pricing Plan
                </label>
                <select
                  value={editPlanData.plan}
                  onChange={(e) =>
                    setEditPlanData({ ...editPlanData, plan: e.target.value as any })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs cursor-pointer outline-none"
                >
                  <option value="Basic">Basic Tier</option>
                  <option value="Pro">Pro Tier</option>
                  <option value="Enterprise">Enterprise Tier</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Renewal Date
                </label>
                <input
                  type="date"
                  value={editPlanData.renewalDate}
                  onChange={(e) =>
                    setEditPlanData({ ...editPlanData, renewalDate: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Active Modules Gates (Select Multiple)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[100px] overflow-y-auto border border-border/80 p-2.5 rounded-xl bg-muted/15">
                  {AVAILABLE_MODULES.map((m) => {
                    const checked = editPlanData.modules.includes(m);
                    return (
                      <label
                        key={m}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setEditPlanData({
                              ...editPlanData,
                              modules: checked
                                ? editPlanData.modules.filter((item) => item !== m)
                                : [...editPlanData.modules, m],
                            });
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" className="rounded-xl">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DEEP INSPECTOR PROFILE DRAWER */}
      {inspectedSchoolId && inspectedSchool && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInspectedSchoolId(null)}
          />
          <div className="relative w-full max-w-lg bg-card border-l border-border h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-5 text-white flex items-start justify-between border-b border-indigo-900 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={inspectedSchool.logoUrl}
                  alt="school"
                  className="h-12 w-12 rounded-xl object-cover border border-white/20 shadow-md"
                />
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white leading-tight">
                    {inspectedSchool.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300 mt-1">
                    Code: {inspectedSchool.slug}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedSchoolId(null)}
                className="text-indigo-200 hover:text-white bg-white/10 p-1.5 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-indigo-400" /> Instance Profile Specs
                </h4>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Unique ID (UUID):</span>
                    <div className="font-mono font-bold text-foreground bg-muted px-2 py-1 rounded select-all truncate text-[9px]">
                      {inspectedSchool.id}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Verification status:</span>
                    <div>
                      {inspectedSchool.isVerified ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Approved Deployment
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="h-4 w-4" /> Awaiting Approval
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">School Type:</span>
                    <strong className="text-foreground">{inspectedSchool.type} Scope</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">School Board:</span>
                    <strong className="text-foreground">{inspectedSchool.board}</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Active Students:</span>
                    <strong className="text-foreground">
                      {inspectedSchool.studentCount} Users
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Active Faculty:</span>
                    <strong className="text-foreground">
                      {inspectedSchool.teacherCount} Teachers
                    </strong>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Contact Email:
                    </span>
                    <strong className="text-foreground font-mono">
                      {inspectedSchool.adminEmail}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> Phone Support:
                    </span>
                    <strong className="text-foreground">
                      {inspectedSchool.contact || "None Specified"}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" /> Portal Website:
                    </span>
                    <strong className="text-indigo-400 hover:underline block truncate">
                      {inspectedSchool.website ? (
                        <a href={inspectedSchool.website} target="_blank" rel="noreferrer">
                          {inspectedSchool.website}
                        </a>
                      ) : (
                        "None"
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Billing and Integrations */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1 flex items-center gap-1">
                  <Sliders className="h-4 w-4 text-indigo-400" /> Subscription & API License keys
                </h4>
                <div className="bg-muted/30 border p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pricing Plan:</span>
                    <strong className="text-indigo-500 font-bold">
                      {inspectedSchool.plan} Tier
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Renewal:</span>
                    <strong className="text-foreground">{inspectedSchool.renewalDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax Status:</span>
                    <strong className="text-foreground">
                      {inspectedSchool.taxEnabled ? "Exclusive GST Enabled" : "Tax Exempted"}
                    </strong>
                  </div>
                  <div className="space-y-1 pt-1.5 border-t">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                      Active API Credentials Node
                    </span>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        type="text"
                        value={inspectedSchool.apiKey || "sk_live_f3b9c0d1e2f3a4b5c6"}
                        className="font-mono text-[9px] flex-1 rounded bg-card border px-2 py-1 text-muted-foreground select-all"
                      />
                      <button
                        onClick={() => rotateApiKey(inspectedSchool.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer uppercase flex items-center gap-1"
                      >
                        <RotateCw className="h-3 w-3" /> Rotate Key
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
