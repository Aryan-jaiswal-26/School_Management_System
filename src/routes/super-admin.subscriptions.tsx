import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-ui";
import { Plus, Check, X, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/subscriptions")({
  component: SuperAdminSubscriptions,
});

function SuperAdminSubscriptions() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['superAdmin', 'plans'],
    queryFn: SuperAdminAPI.getPlans
  });

  const plans = data?.data || [];

  const createPlanMutation = useMutation({
    mutationFn: SuperAdminAPI.createPlan,
    onSuccess: () => {
      toast.success("Subscription plan saved successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'plans'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save plan");
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => SuperAdminAPI.updatePlan(id, data),
    onSuccess: () => {
      toast.success("Subscription plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'plans'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update plan");
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: SuperAdminAPI.deletePlan,
    onSuccess: () => {
      toast.success("Subscription plan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'plans'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete plan");
    }
  });

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this subscription plan?")) {
      deletePlanMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const name = (document.getElementById('plan-name') as HTMLInputElement).value.trim();
    const code = (document.getElementById('plan-code') as HTMLSelectElement).value;
    const price = parseFloat((document.getElementById('plan-price') as HTMLInputElement).value);
    const billingCycle = (document.getElementById('plan-billing-cycle') as HTMLSelectElement).value;
    const maxStudents = parseInt((document.getElementById('plan-max-students') as HTMLInputElement).value);
    const maxTeachers = parseInt((document.getElementById('plan-max-teachers') as HTMLInputElement).value);
    const maxStorageGB = parseFloat((document.getElementById('plan-max-storage') as HTMLInputElement).value);

    // Parse features (splitting by comma or newline, then filter empty strings)
    const featuresRaw = (document.getElementById('plan-features') as HTMLTextAreaElement).value;
    const features = featuresRaw
      .split(/[,\n]/)
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (!name || isNaN(price) || isNaN(maxStudents) || isNaN(maxTeachers) || isNaN(maxStorageGB)) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    const maxStorageBytes = Math.round(maxStorageGB * 1024 * 1024 * 1024);

    const payload = {
      name,
      code,
      price,
      currency: "USD",
      billingCycle,
      features,
      limits: {
        maxStudents,
        maxTeachers,
        maxStorageBytes
      }
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan._id || editingPlan.id, data: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Subscription Plans"
          description="Manage SaaS pricing tiers, limits, and feature access."
        />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <div className="col-span-3 text-center py-10">
            <div className="animate-spin inline-block h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {!isLoading && plans.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed p-8">
            <p className="text-slate-500 dark:text-slate-400">No subscription plans found. Create one to get started.</p>
          </div>
        )}

        {plans.map((plan: any) => {
          const isStandard = plan.code === 'STANDARD';
          return (
            <div 
              key={plan._id || plan.id} 
              className={`relative rounded-2xl border bg-card p-8 shadow-sm flex flex-col justify-between ${
                isStandard 
                  ? 'border-indigo-500 ring-1 ring-indigo-500 dark:bg-slate-900' 
                  : 'border-border'
              }`}
            >
              {isStandard && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[10px] font-semibold text-white tracking-wide uppercase">
                  Most Popular
                </span>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <span className="rounded bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {plan.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(plan)} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(plan._id || plan.id)} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="my-6">
                  <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                  <span className="text-sm font-medium text-muted-foreground">/{plan.billingCycle?.toLowerCase() || 'monthly'}</span>
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                  
                  <li className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Max Students: {plan.limits?.maxStudents ?? plan.maxStudents ?? 0}
                    </span>
                  </li>
                  
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Max Teachers: {plan.limits?.maxTeachers ?? 0}
                    </span>
                  </li>
                  
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Max Storage: {plan.limits?.maxStorageBytes ? (plan.limits.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(1) : "0"} GB
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div key={editingPlan?._id || 'new'} className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                  <input 
                    id="plan-name" 
                    type="text" 
                    defaultValue={editingPlan?.name || ""} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2.5 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="e.g. Starter" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Code</label>
                  <select 
                    id="plan-code" 
                    defaultValue={editingPlan?.code || "BASIC"} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2.5 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FREE_TRIAL">FREE_TRIAL</option>
                    <option value="BASIC">BASIC</option>
                    <option value="STANDARD">STANDARD</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price ($)</label>
                  <input 
                    id="plan-price" 
                    type="number" 
                    defaultValue={editingPlan?.price !== undefined ? editingPlan.price : ""} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2.5 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="0" 
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Billing Cycle</label>
                  <select 
                    id="plan-billing-cycle" 
                    defaultValue={editingPlan?.billingCycle || "MONTHLY"} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2.5 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 my-4 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Plan Limits</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Students</label>
                    <input 
                      id="plan-max-students" 
                      type="number" 
                      defaultValue={editingPlan?.limits?.maxStudents || 500} 
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      min="1"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Teachers</label>
                    <input 
                      id="plan-max-teachers" 
                      type="number" 
                      defaultValue={editingPlan?.limits?.maxTeachers || 50} 
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      min="1"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Storage (GB)</label>
                    <input 
                      id="plan-max-storage" 
                      type="number" 
                      defaultValue={editingPlan?.limits?.maxStorageBytes ? (editingPlan.limits.maxStorageBytes / (1024 * 1024 * 1024)) : 5} 
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      min="1"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Features (comma or newline separated)
                </label>
                <textarea 
                  id="plan-features" 
                  defaultValue={editingPlan?.features ? editingPlan.features.join(", ") : ""} 
                  rows={3}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 p-2.5 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                  placeholder="e.g. LMS, Attendance, Gradebook, HR" 
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 p-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
