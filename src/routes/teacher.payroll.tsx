import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { Download, Calendar, DollarSign, Loader2, FileText, WalletCards } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/payroll")({
  head: () => ({ meta: [{ title: "Payslips & Salary · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayroll() {
      try {
        const res = await apiClient<any>("/teacher/payroll");
        setPayrollData(res?.data || { payslips: [], attendance: { present: 0, total: 0, leaves: 0 } });
      } catch (err) {
        setPayrollData({ payslips: [], attendance: { present: 0, total: 0, leaves: 0 } });
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, []);

  const handleDownload = () => {
    toast.success("Downloading Payslip...", { description: "PDF is being generated." });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payslips & Personal Attendance" 
        subtitle="View your salary breakdowns, download payslips, and track your monthly attendance." 
      />

      {loading ? (
        <div className="flex justify-center items-center py-20 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" /> Loading payroll information...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Panel title="Current Month Attendance">
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted mb-4">
                  <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent border-r-transparent transform -rotate-45 opacity-50" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{payrollData.attendance.present || 0}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Days</div>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-2 text-center text-xs mt-2">
                  <div className="bg-muted p-2 rounded-lg border border-border">
                    <div className="font-bold text-foreground">{payrollData.attendance.total || 0}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Working Days</div>
                  </div>
                  <div className="bg-destructive/10 p-2 rounded-lg border border-destructive/20 text-destructive">
                    <div className="font-bold">{payrollData.attendance.leaves || 0}</div>
                    <div className="text-[10px] uppercase">Leaves Taken</div>
                  </div>
                </div>
              </div>
            </Panel>
            
            <Panel title="Salary Structure Summary" action={<WalletCards className="h-4 w-4 text-muted-foreground" />}>
               <div className="space-y-3 mt-2">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Basic Pay</span>
                   <span className="font-semibold text-foreground">₹---</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Allowances</span>
                   <span className="font-semibold text-foreground">₹---</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Deductions</span>
                   <span className="font-semibold text-destructive">- ₹---</span>
                 </div>
                 <div className="pt-3 border-t border-border flex justify-between items-center text-sm font-bold">
                   <span>Net Salary</span>
                   <span className="text-primary">₹---</span>
                 </div>
               </div>
            </Panel>
          </div>

          <div className="lg:col-span-2">
            <Panel title="Payslip History">
              {payrollData.payslips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/30">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold">No Payslips Available</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Your salary slips will be generated and available here at the end of each billing cycle.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {payrollData.payslips.map((slip: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{slip.month} {slip.year}</h4>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">Net Pay: ₹{slip.netPay?.toLocaleString() || "---"}</div>
                        </div>
                      </div>
                      <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
