import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Wallet,
  Download,
  CreditCard,
  CheckCircle,
  FileText,
  DollarSign,
  QrCode,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader, Panel, StatCard, EmptyState } from "@/components/module-shell";
import { apiClient, BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/parent/fees")({
  head: () => ({ meta: [{ title: "Fee Ledger · Campus OS" }] }),
  component: ParentFees,
});

function ParentFees() {
  const [activeChildId, setActiveChildId] = useState<string>("");
  const [activeChildName, setActiveChildName] = useState<string>("Student");
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<"card" | "upi">("card");
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [childFees, setChildFees] = useState<any[]>([]);
  const [childTransactions, setChildTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parentName, setParentName] = useState<string>("");

  // Sync active child from parent layout header
  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem("parent_active_child") || "";
      const name = localStorage.getItem("parent_active_child_name") || "Student";
      setActiveChildId(stored);
      setActiveChildName(name);
    };
    handleSync();
    window.addEventListener("activeChildChanged", handleSync);
    return () => window.removeEventListener("activeChildChanged", handleSync);
  }, []);

  const loadFees = useCallback(async () => {
    if (!activeChildId) return;
    setIsLoading(true);
    try {
      const [feesRes, txnsRes] = await Promise.allSettled([
        apiClient<any>(`/parents/fees?studentId=${activeChildId}`),
        apiClient<any>(`/parents/payments?studentId=${activeChildId}`),
      ]);
      setChildFees(feesRes.status === "fulfilled" ? feesRes.value?.data || [] : []);
      setChildTransactions(txnsRes.status === "fulfilled" ? txnsRes.value?.data || [] : []);
    } finally {
      setIsLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => { loadFees(); }, [loadFees]);

  // Load parent profile name for receipt
  useEffect(() => {
    apiClient<any>("/parents/profile")
      .then((res) => setParentName(res?.data?.name || res?.data?.parentName || ""))
      .catch(() => {});
  }, []);

  const totalDue = childFees.reduce((a: number, f: any) => a + (f.dueAmount ?? f.due ?? 0), 0);
  const totalPaid = childFees.reduce((a: number, f: any) => a + (f.paidAmount ?? f.paid ?? 0), 0);

  const handlePayFee = (feeId: string) => {
    setSelectedFeeId(feeId);
    setShowCheckout(true);
  };

  const executePayment = async () => {
    const targetFee = childFees.find((f: any) => (f._id || f.id) === selectedFeeId);
    if (!targetFee) return;
    const amount = targetFee.dueAmount ?? targetFee.due ?? 0;
    try {
      // 1. Initialize checkout session
      const checkoutRes = await apiClient<any>("/payments/checkout", {
        method: "POST",
        data: {
          feeId: selectedFeeId,
          schoolId: targetFee.schoolId || "school123", // fallback
          studentId: activeChildId,
          amount,
        },
      });

      // 2. Simulate gateway processing
      toast.info("Redirecting to Secure Gateway...");
      
      setTimeout(async () => {
        // 3. Simulate successful webhook callback from Gateway
        try {
          await apiClient("/payments/webhook", {
            method: "POST",
            data: {
              event: "payment_intent.succeeded",
              paymentId: checkoutRes.paymentId,
              transactionId: `txn_${Date.now()}`
            }
          });
          toast.success("Payment Successful!", { description: `₹${amount.toLocaleString()} processed via Gateway.` });
          setShowCheckout(false);
          loadFees();
        } catch (e) {
          toast.error("Gateway confirmation failed");
        }
      }, 2000);

    } catch (err) {
      toast.error("Failed to initialize payment gateway checkout");
    }
  };

  if (!activeChildId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Wallet className="h-10 w-10 text-muted-foreground mb-3" />
        <div className="font-semibold text-foreground">No child selected</div>
        <p className="text-sm text-muted-foreground mt-1">Select a child profile from the top bar.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fee Ledger & Invoice Vault"
        subtitle={`Fee schedules, receipts and fast payments for ${activeChildName}`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading fee records...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <StatCard label="Total Academic Dues" value={`₹${totalDue.toLocaleString()}`} icon={Wallet} tone={totalDue > 0 ? "warning" : "success"} />
            <StatCard label="Fees Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CheckCircle} tone="success" />
            <StatCard label="Discount & Concessions" value="Applied" delta="Sibling waiver calculated by admin" icon={DollarSign} tone="info" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Panel title="Outstanding Fee Schedules">
                {childFees.length === 0 ? (
                  <EmptyState icon={CheckCircle} title="No Outstanding Fees" description="All fee schedules are cleared for this student." />
                ) : (
                  <div className="space-y-4">
                    {childFees.map((fee: any) => {
                      const feeId = fee._id || fee.id;
                      const category = fee.feeType || fee.category || "Fee";
                      const status = fee.status || "pending";
                      const dueDate = fee.dueDate || fee.due_date;
                      const amount = fee.amount || fee.totalAmount || 0;
                      const paid = fee.paidAmount ?? fee.paid ?? 0;
                      const due = fee.dueAmount ?? fee.due ?? (amount - paid);
                      return (
                        <div key={feeId} className="rounded-xl border border-border p-4 bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">{category} Fee</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${status === "paid" ? "bg-emerald-500/15 text-emerald-600" : status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
                                {status}
                              </span>
                            </div>
                            {dueDate && <div className="text-xs text-muted-foreground">Due: <span className="font-medium">{new Date(dueDate).toLocaleDateString()}</span></div>}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <div>Total: <span className="text-foreground font-medium">₹{amount.toLocaleString()}</span></div>
                              <div>Paid: <span className="text-foreground font-medium">₹{paid.toLocaleString()}</span></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-foreground">₹{due.toLocaleString()}</span>
                            {due > 0 && (
                              <button onClick={() => handlePayFee(feeId)} className="flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-xs font-semibold hover:bg-accent/90 shadow transition-all active:scale-95">
                                <CreditCard className="h-3.5 w-3.5" /> Quick Pay
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <Panel title="Paid Invoices & Receipt History">
                {childTransactions.length === 0 ? (
                  <EmptyState icon={FileText} title="No Receipts Yet" description="Completed payments will appear as downloadable receipts here." />
                ) : (
                  <div className="divide-y divide-border">
                    {childTransactions.map((txn: any) => (
                      <div key={txn._id || txn.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{txn.feeType || txn.category || "Fee"} Installment</div>
                          <div className="text-xs text-muted-foreground">
                            {txn.date || txn.createdAt ? new Date(txn.date || txn.createdAt).toLocaleDateString() : "—"} · via {txn.method || txn.paymentMethod || "Online"} · Ref: {txn.receiptNo || txn.transactionId || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">+ ₹{(txn.amountPaid || txn.amount || 0).toLocaleString()}</span>
                          <button onClick={() => window.open(`${BASE_URL}/v1/invoices/${txn._id || txn.id}/pdf`, "_blank")} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-blue-500 hover:bg-blue-50" title="Download Tax Invoice">
                            <Download className="h-4 w-4" />
                          </button>
                          <button onClick={() => setViewingReceipt(txn)} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div>
              <Panel title="Fee Regulations & Penalty Rules">
                <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                  <div className="rounded-lg bg-muted/40 border border-border p-3">
                    <div className="font-bold text-foreground mb-1">Sibling Concession Engine</div>
                    Automatic concession of 10% applied to tuition for families with multiple active enrollments.
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border p-3">
                    <div className="font-bold text-foreground mb-1">Late Penalty Policy</div>
                    A progressive penalty of ₹100/day is levied starting 7 days post due-date.
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border p-3">
                    <div className="font-bold text-foreground mb-1">Payment Gateways</div>
                    256-bit encrypted transaction logs routed directly to accounts ledger.
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowCheckout(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent animate-bounce" />
                <h2 className="text-base font-bold text-foreground">Secure Payment Gateway</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2 p-1 rounded-lg bg-muted mb-4 text-xs font-semibold">
              <button onClick={() => setCheckoutMethod("card")} className={`flex-1 py-2 rounded-md transition-all ${checkoutMethod === "card" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>Debit/Credit Card</button>
              <button onClick={() => setCheckoutMethod("upi")} className={`flex-1 py-2 rounded-md transition-all ${checkoutMethod === "upi" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>UPI QR Pay</button>
            </div>
            {checkoutMethod === "card" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Cardholder Name</label>
                  <input defaultValue={parentName} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Card Number</label>
                  <input placeholder="4111 2222 3333 4444" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Expiry</label>
                    <input placeholder="MM/YY" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">CVV</label>
                    <input placeholder="***" type="password" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-xl bg-muted/20">
                <QrCode className="h-28 w-28 text-foreground" />
                <span className="text-xs text-muted-foreground mt-2 font-medium">Scan via GPay, PhonePe, or BHIM</span>
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-[oklch(0.45_0.15_155)]" /> PCI-DSS Compliance
              </div>
              <button onClick={executePayment} className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-xs font-semibold hover:bg-primary/90 shadow active:scale-95 transition-all">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingReceipt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border text-foreground font-serif animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b-2 border-primary pb-3 font-sans">
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-primary">CAMPUS OS ACADEMY</h1>
                <p className="text-[10px] text-muted-foreground">Affiliation ID: 194883 | Finance Dept.</p>
              </div>
              <span className="text-xs font-bold uppercase bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-500/20">OFFICIAL RECEIPT</span>
            </div>
            <div className="my-6 space-y-2 text-xs font-sans">
              <div className="flex justify-between"><span className="text-muted-foreground">Received From:</span><span className="font-semibold">{parentName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Student:</span><span className="font-semibold">{activeChildName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-semibold">{viewingReceipt.feeType || viewingReceipt.category || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Date:</span><span className="font-semibold">{viewingReceipt.date ? new Date(viewingReceipt.date).toLocaleDateString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method:</span><span className="font-semibold">{viewingReceipt.method || viewingReceipt.paymentMethod || "—"}</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-4 text-xs font-sans">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Digitally Verified</div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Amount Settled</div>
                <div className="text-xl font-extrabold text-primary">₹{(viewingReceipt.amount || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2 font-sans">
              <button onClick={() => window.print()} className="rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground px-4 py-2 text-xs font-semibold shadow-sm">Print</button>
              <button onClick={() => setViewingReceipt(null)} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
