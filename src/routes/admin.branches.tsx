import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Building2, Plus, Edit2, ShieldAlert, GitBranch, 
  UserCheck, Users, GraduationCap, CheckCircle, XCircle, Trash2 
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/branches")({
  head: () => ({ meta: [{ title: "Branch Management · Campus OS" }] }),
  component: BranchManagementPage,
});

interface Branch {
  _id: string;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

function BranchManagementPage() {
  const [activeTab, setActiveTab] = useState<"list" | "assign">("list");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Assignment states
  const [entityType, setEntityType] = useState<"student" | "teacher" | "staff" | "class" | "section">("student");
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data: Branch[] }>("/branches?limit=100");
      setBranches(res?.data || []);
    } catch (err) {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      setLoadingEntities(true);
      setEntities([]);
      setSelectedEntityId("");
      let endpoint = "";
      if (entityType === "student") {
        endpoint = "/students?limit=100";
      } else if (entityType === "teacher") {
        endpoint = "/employees?employeeType=TEACHING&limit=100";
      } else if (entityType === "staff") {
        endpoint = "/employees?employeeType=NON_TEACHING&limit=100";
      } else if (entityType === "class") {
        endpoint = "/academics/classes?limit=100";
      } else if (entityType === "section") {
        endpoint = "/academics/sections?limit=100";
      }

      const res = await apiClient<any>(endpoint);
      const data = res?.data || res || [];
      // Normalize array based on response format
      const list = Array.isArray(data) ? data : data?.data || [];
      setEntities(list);
    } catch (err) {
      toast.error(`Failed to load ${entityType}s`);
    } finally {
      setLoadingEntities(false);
    }
  };

  useEffect(() => {
    void fetchBranches();
  }, []);

  useEffect(() => {
    if (activeTab === "assign") {
      void fetchEntities();
    }
  }, [entityType, activeTab]);

  const handleToggleActive = async (branch: Branch) => {
    const action = branch.isActive ? "deactivate" : "activate";
    try {
      await apiClient(`/branches/${branch._id}/${action}`, { method: "PATCH" });
      toast.success(`Branch ${branch.name} ${action}d successfully`);
      void fetchBranches();
    } catch (err) {
      toast.error(`Failed to ${action} branch`);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!confirm(`Are you sure you want to delete ${branch.name}? This cannot be undone.`)) return;
    try {
      await apiClient(`/branches/${branch._id}`, { method: "DELETE" });
      toast.success(`Branch ${branch.name} deleted successfully`);
      void fetchBranches();
    } catch (err) {
      toast.error("Failed to delete branch");
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || !targetBranchId) {
      toast.error("Please select both an entity and a target branch");
      return;
    }

    try {
      setAssigning(true);
      await apiClient(`/branches/${targetBranchId}/assign`, {
        method: "POST",
        data: {
          entityType,
          entityId: selectedEntityId,
        },
      });
      toast.success(`Successfully assigned ${entityType} to branch`);
      setSelectedEntityId("");
    } catch (err) {
      toast.error("Failed to assign entity to branch");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Branch Management"
        subtitle="Configure campuses and assign school resources"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingBranch(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> Create Branch
            </button>
          </div>
        }
      />

      <div className="mt-6 flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "list"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Branches List
        </button>
        <button
          onClick={() => setActiveTab("assign")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "assign"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Assign Resources
        </button>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            </div>
          ) : branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground">No branches found</h3>
              <p className="text-sm text-muted-foreground mt-1">Get started by creating a new campus branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((b) => (
                <Panel
                  key={b._id}
                  title={b.name}
                  action={
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBranch(b);
                          setShowAddModal(true);
                        }}
                        className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Branch"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`rounded-lg p-1.5 hover:bg-muted transition-colors ${
                          b.isActive ? "text-success hover:text-success/80" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={b.isActive ? "Deactivate Branch" : "Activate Branch"}
                      >
                        {b.isActive ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(b)}
                        className="rounded-lg p-1.5 hover:bg-muted text-destructive hover:text-destructive/80 transition-colors"
                        title="Delete Branch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-2.5 text-xs text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Code:</span>
                      <span className="uppercase text-foreground font-mono">{b.code}</span>
                    </div>
                    {b.address && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold shrink-0">Address:</span>
                        <span className="text-right text-foreground line-clamp-2">{b.address}</span>
                      </div>
                    )}
                    {b.contactEmail && (
                      <div className="flex justify-between">
                        <span className="font-semibold">Email:</span>
                        <span className="text-foreground">{b.contactEmail}</span>
                      </div>
                    )}
                    {b.contactPhone && (
                      <div className="flex justify-between">
                        <span className="font-semibold">Phone:</span>
                        <span className="text-foreground">{b.contactPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-border/40">
                      <span>Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          b.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl">
          <Panel title="Assign Entity to Branch">
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resource Type</label>
                <div className="grid grid-cols-5 gap-2 mt-1.5">
                  {(["student", "teacher", "staff", "class", "section"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEntityType(type)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold capitalize transition-all ${
                        entityType === type
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select {entityType}</label>
                {loadingEntities ? (
                  <div className="h-10 flex items-center justify-center border border-border rounded-xl mt-1">
                    <div className="h-4 w-4 animate-spin rounded-full border border-primary/25 border-t-primary" />
                  </div>
                ) : (
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    required
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">-- Choose {entityType} --</option>
                    {entities.map((ent: any) => {
                      let displayName = "";
                      if (entityType === "student") {
                        displayName = `${ent.user?.firstName || ""} ${ent.user?.lastName || ""} (${ent.admissionNumber})`;
                      } else if (entityType === "teacher" || entityType === "staff") {
                        displayName = `${ent.user?.firstName || ""} ${ent.user?.lastName || ""} [${ent.employeeId}]`;
                      } else if (entityType === "class") {
                        displayName = ent.name;
                      } else if (entityType === "section") {
                        displayName = `${ent.classId?.name || "Class"} - ${ent.name}`;
                      }
                      return (
                        <option key={ent._id} value={ent._id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Branch</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {assigning ? "Assigning..." : `Assign ${entityType}`}
              </button>
            </form>
          </Panel>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground">
                {editingBranch ? "Edit Branch" : "New Branch"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data = {
                  name: fd.get("name") as string,
                  code: (fd.get("code") as string).toUpperCase(),
                  address: fd.get("address") as string,
                  contactEmail: fd.get("contactEmail") as string,
                  contactPhone: fd.get("contactPhone") as string,
                };

                try {
                  if (editingBranch) {
                    await apiClient(`/branches/${editingBranch._id}`, {
                      method: "PUT",
                      data,
                    });
                    toast.success("Branch updated");
                  } else {
                    await apiClient("/branches", {
                      method: "POST",
                      data,
                    });
                    toast.success("Branch created");
                  }
                  setShowAddModal(false);
                  void fetchBranches();
                } catch (err) {
                  toast.error("Failed to save branch");
                }
              }}
              className="space-y-4 text-xs font-medium text-muted-foreground"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Branch Name</label>
                <input
                  name="name"
                  required
                  defaultValue={editingBranch?.name || ""}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. North Campus"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Branch Code</label>
                <input
                  name="code"
                  required
                  defaultValue={editingBranch?.code || ""}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 uppercase font-mono"
                  placeholder="e.g. NC01"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Address</label>
                <textarea
                  name="address"
                  defaultValue={editingBranch?.address || ""}
                  className="mt-1 min-h-[60px] w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="e.g. 123 Main St, Seattle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Contact Email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={editingBranch?.contactEmail || ""}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="north@school.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Contact Phone</label>
                  <input
                    name="contactPhone"
                    type="tel"
                    defaultValue={editingBranch?.contactPhone || ""}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="+1 (206) 555-0199"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] mt-2"
              >
                {editingBranch ? "Update Branch" : "Create Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
