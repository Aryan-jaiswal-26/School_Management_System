import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wallet, CheckCircle, CreditCard } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import { apiClient, BASE_URL } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/fees")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [myFees, setMyFees] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  useEffect(() => {
    const getStudentId = async () => {
      if (user?.studentId) {
        return user.studentId;
      }
      try {
        const sRes = await apiClient<any>("/students");
        return sRes?.data?.[0]?._id || null;
      } catch (err) {
        console.error("Failed to query fallback students:", err);
        return null;
      }
    };

    getStudentId().then((sid) => {
      if (!sid) return;
      setActiveStudentId(sid);
      Promise.all([
        apiClient<any>(`/fees/student/${sid}`),
        apiClient<any>(`/fees/student/${sid}/payments`)
      ]).then(([fRes, pRes]) => {
        setMyFees(fRes?.data || []);
        setMyPayments(pRes?.data || []);
      }).catch((err) => {
        console.error("Failed to load student fees or payments:", err);
        toast.error("Failed to load fees data");
      });
    });
  }, [user?.studentId]);

  const totalDue = myFees.reduce((a, f) => a + ((f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0)), 0);
  const totalPaid = myFees.reduce((a, f) => a + (f.paidAmount || 0), 0);

  const handlePay = async (feeId: string, amount: number) => {
    setPaying(true);
    const feeObj = myFees.find((f) => f._id === feeId);
    const schoolId = feeObj?.schoolId || user?.schoolId || "school123";
    try {
      await apiClient<any>("/payments/checkout", {
        method: "POST",
        data: {
          feeId,
          schoolId,
          studentId: activeStudentId,
          amount,
        }
      });
      
      toast.info("Redirecting to Secure Gateway...");

      setTimeout(async () => {
        try {
          await apiClient("/payments/webhook", {
            method: "POST",
            data: {
              feeId,
              studentId: activeStudentId,
              schoolId,
              amount,
              transactionId: `txn_${Date.now()}`,
              method: "ONLINE"
            }
          });
          toast.success("Payment successful!");
          setShowReceipt(`RCPT-${Date.now().toString().slice(-6)}`);
          
          if (activeStudentId) {
            Promise.all([
              apiClient<any>(`/fees/student/${activeStudentId}`),
              apiClient<any>(`/fees/student/${activeStudentId}/payments`)
            ]).then(([fRes, pRes]) => {
              setMyFees(fRes?.data || []);
              setMyPayments(pRes?.data || []);
            });
          }
        } catch (e) {
          toast.error("Gateway confirmation failed");
        } finally {
          setPaying(false);
        }
      }, 2000);

    } catch (err) {
      toast.error("Payment failed");
      setPaying(false);
    }
  };

  return (
    <div>
      <PageHeader title="Fees & Payments" subtitle="View dues and make payments" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard
          label="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={`₹${totalDue.toLocaleString()}`}
          icon={Wallet}
          tone={totalDue > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Transactions"
          value={String(myPayments.length)}
          icon={CreditCard}
          tone="info"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Outstanding Dues">
          {myFees.filter((f) => ((f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0)) > 0).length > 0 ? (
            <div className="space-y-3">
              {myFees
                .filter((f) => ((f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0)) > 0)
                .map((f) => {
                  const due = (f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0);
                  return (
                    <div key={f._id} className="rounded-lg border border-border p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{f.feeType}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Due: ₹{due.toLocaleString()} · By {new Date(f.dueDate).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handlePay(f._id, due)}
                        disabled={paying}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {paying ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Pay ₹{due.toLocaleString()}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-[oklch(0.45_0.15_155)] mb-3" />
              <div className="font-semibold">All Clear!</div>
              <div className="text-sm text-muted-foreground">No outstanding dues.</div>
            </div>
          )}
        </Panel>
        <Panel title="Payment History">
          <div className="space-y-3">
            {myPayments.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <div className="text-sm font-medium">₹{p.amountPaid?.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.paymentDate).toLocaleDateString()} · {p.paymentMethod}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-[oklch(0.45_0.15_155)] mb-1">
                    {p.receiptNumber}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => window.open(`${BASE_URL}/v1/invoices/${p._id}/pdf`, "_blank")} className="text-[10px] font-bold text-blue-500 hover:underline">
                      Tax Invoice
                    </button>
                    <span className="rounded-full px-2 py-0.5 text-[10px] bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]">
                      Success
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {myPayments.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No transactions yet.
            </div>
          )}
        </Panel>
      </div>
      {showReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowReceipt(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl text-center"
          >
            <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)] mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold">Payment Confirmed</h2>
            <p className="text-sm text-muted-foreground mt-1">Receipt: {showReceipt}</p>
            <button
              onClick={() => setShowReceipt(null)}
              className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
