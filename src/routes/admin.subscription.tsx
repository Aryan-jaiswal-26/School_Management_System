import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageHeader, Panel } from "@/components/module-shell";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  Cpu, 
  HardDrive, 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/subscription")({
  head: () => ({ meta: [{ title: "Subscription & Billing · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NET_BANKING">("UPI");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const schoolId = user?.schoolId || "";

  // 1. Fetch current subscription
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["school", "subscription", schoolId],
    queryFn: () => apiClient<any>(`/schools/${schoolId}/subscription`),
    enabled: !!schoolId,
  });

  // 2. Fetch invoices history
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["school", "invoices", schoolId],
    queryFn: () => apiClient<any[]>(`/schools/${schoolId}/invoices`),
    enabled: !!schoolId,
  });

  // 3. Fetch public plans
  const { data: plansData } = useQuery({
    queryKey: ["publicPlans"],
    queryFn: () => apiClient<any[]>("/auth/plans"),
  });

  // 4. Renewal/Upgrade Mutation
  const subscribeMutation = useMutation({
    mutationFn: (payload: {
      planCode: string;
      durationMonths: number;
      amount: number;
      paymentMethod: string;
      transactionId: string;
    }) => apiClient(`/schools/${schoolId}/subscribe`, {
      method: "POST",
      data: payload,
    }),
    onSuccess: () => {
      toast.success("Subscription updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["school", "subscription", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["school", "invoices", schoolId] });
      setIsCheckoutOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update subscription.");
    }
  });

  const subscription = subData;
  const currentPlan = subscription?.planId;
  const invoices = invoicesData || [];
  const plans = plansData || [];

  // Calculate pricing & values
  const chosenPlan = plans.find((p: any) => p.code === selectedPlanCode) || plans[0];
  const unitPrice = chosenPlan ? chosenPlan.price : 0;
  const rawPrice = unitPrice * selectedMonths;
  const discountAmount = selectedMonths >= 12 ? rawPrice * 0.20 : selectedMonths >= 6 ? rawPrice * 0.12 : 0;
  const priceAfterDiscount = rawPrice - discountAmount;
  const taxAmount = priceAfterDiscount * 0.18;
  const totalPrice = priceAfterDiscount + taxAmount;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    subscribeMutation.mutate({
      planCode: selectedPlanCode,
      durationMonths: selectedMonths,
      amount: priceAfterDiscount,
      paymentMethod,
      transactionId,
    });
  };

  const handleDownloadInvoice = (inv: any) => {
    const content = `=====================================================
                 CAMPUS OS INVOICE RECEIPT
=====================================================
Invoice Date:      ${new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}
Invoice Number:    ${inv.invoiceNumber}
Status:            PAID
-----------------------------------------------------
CUSTOMER DETAILS
School ID:         ${inv.schoolId}
-----------------------------------------------------
BILLING SUMMARY
Base Amount:       INR ${inv.amount}
Tax / GST (18%):   INR ${inv.taxAmount}
Total Amount:      INR ${inv.totalAmount}
Payment Method:    ${inv.paymentMethod}
Reference/Txn ID:  ${inv.paymentGatewayRef}
=====================================================
             Thank you for choosing Campus OS!
=====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${inv.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded successfully.");
  };

  const getRemainingDays = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const diff = new Date(endDateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const remainingDays = currentPlan ? getRemainingDays(subscription.endDate) : 0;

  if (subLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader 
        title="Subscription & Billing" 
        subtitle="Manage your SaaS subscription, monitor school usage quotas, and view billing invoices." 
      />

      {/* 1. Subscription Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Plan</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                subscription?.status === "ACTIVE" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20"
              }`}>
                {subscription?.status || "TRIALING"}
              </span>
            </div>
            <h4 className="text-2xl font-extrabold text-foreground">{currentPlan?.name || "Free Trial"}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Billing cycle: {currentPlan?.billingCycle || "MONTHLY"}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Expires {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Validity Days</span>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <h4 className="text-3xl font-extrabold text-foreground">{remainingDays} Days</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Remaining days until renewal window opens
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
            {remainingDays <= 7 ? (
              <span className="text-amber-500 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Plan expires soon! Renew now.</span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Subscription is fully active.</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Ledger</span>
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </div>
            <h4 className="text-2xl font-extrabold text-foreground">
              INR {currentPlan ? currentPlan.price.toLocaleString() : "0"}/month
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Active licensing cost of your cloud tenant
            </p>
          </div>
          <button 
            onClick={() => {
              if (plans.length > 0) {
                setSelectedPlanCode(plans[0].code);
                setIsCheckoutOpen(true);
              }
            }}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Upgrade or Renew Plan <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Usage Quotas Indicators */}
      <Panel title="Cloud Tenant Resource Quotas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium"><Users className="h-4 w-4" /> Student Capacity</span>
              <span>Max {currentPlan?.limits?.maxStudents || 50}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: "40%" }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground">Currently utilizing 40% of standard capacity roster.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium"><Cpu className="h-4 w-4" /> Staff / Faculty Seats</span>
              <span>Max {currentPlan?.limits?.maxTeachers || 5}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: "60%" }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground">Currently utilizing 60% of faculty licensing seats.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium"><HardDrive className="h-4 w-4" /> Cloud Media Storage</span>
              <span>Max {currentPlan ? (currentPlan.limits?.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(0) : "1"} GB</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: "15%" }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground">Currently utilizing 15% of high-speed storage quota.</p>
          </div>
        </div>
      </Panel>

      {/* 3. Invoices History */}
      <Panel title="Billing Ledger & Payments History">
        <div className="mt-4 overflow-hidden border border-border rounded-xl">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice Number</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Total Amount</th>
                <th className="px-6 py-4 font-semibold">Payment Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoicesLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No invoices found.</td>
                </tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4 font-bold text-indigo-500">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {new Date(inv.paidAt || inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {inv.currency || "INR"} {inv.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{inv.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-0.5 font-semibold">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDownloadInvoice(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-card rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 4. Upgrade/Renewal Checkout Dialog Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-xl flex flex-col md:flex-row overflow-hidden border border-border">
            {/* Left Column: Form config */}
            <div className="flex-1 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Plan Renewal / Upgrade</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure subscription length and complete payment.</p>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Tier</label>
                  <select 
                    value={selectedPlanCode}
                    onChange={(e) => setSelectedPlanCode(e.target.value)}
                    className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    {plans.map((p: any) => (
                      <option key={p._id} value={p.code}>{p.name} (INR {p.price}/mo)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Duration</label>
                  <select 
                    value={selectedMonths}
                    onChange={(e) => setSelectedMonths(Number(e.target.value))}
                    className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months (12% off)</option>
                    <option value={12}>1 Year (20% off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["UPI", "CARD", "NET_BANKING"] as const).map(ch => (
                      <button 
                        key={ch}
                        type="button"
                        onClick={() => setPaymentMethod(ch)}
                        className={`p-2 border rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors ${
                          paymentMethod === ch 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" 
                            : "border-border hover:bg-slate-50"
                        }`}
                      >
                        {ch.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg p-2.5 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {subscribeMutation.isPending ? "Processing..." : "Complete Renewal Payment"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="border border-slate-300 dark:border-slate-700 bg-card rounded-lg px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Receipt Summary Preview */}
            <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <strong className="text-foreground">{chosenPlan?.name || "Standard"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <strong className="text-foreground">{selectedMonths} Mo.</strong>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>Discount</span>
                      <span>-INR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <strong className="text-foreground">INR {taxAmount.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-extrabold text-foreground">
                    <span>Total</span>
                    <span className="text-indigo-500">INR {totalPrice.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-0 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-[10px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>Standard SLA guarantees 99.9% portal uptime and 24/7 priority helpdesk support access keys.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
