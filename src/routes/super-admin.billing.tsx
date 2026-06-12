import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { DollarSign, FileText, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { useState } from "react";

export const Route = createFileRoute("/super-admin/billing")({
  component: SuperAdminBilling,
});

function SuperAdminBilling() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['superAdmin', 'invoices', page],
    queryFn: () => SuperAdminAPI.getInvoices({ page, limit: 10 })
  });

  const invoices = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        description="Monitor platform revenue, invoice status, and payment history."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Revenue (YTD)</p>
            <h4 className="text-2xl font-bold">$342,000</h4>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
            <h4 className="text-2xl font-bold">$12,450</h4>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overdue Invoices</p>
            <h4 className="text-2xl font-bold">$3,150</h4>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Recent Invoices
          </h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-slate-500 dark:text-slate-400 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice ID</th>
                <th className="px-6 py-4 font-semibold">School</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No invoices found.</td>
                </tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{inv.schoolId?.name || "Unknown School"}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium">${inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
                      ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                      ${inv.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                      ${inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : ''}
                    `}>
                      {inv.status === 'Paid' && <CheckCircle className="h-3.5 w-3.5" />}
                      {inv.status === 'Pending' && <Clock className="h-3.5 w-3.5" />}
                      {inv.status === 'Overdue' && <XCircle className="h-3.5 w-3.5" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2" title="Download Invoice">
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
