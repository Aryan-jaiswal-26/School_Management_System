import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, AlertTriangle, CheckCircle, Search, Plus, X, Settings } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient, BASE_URL } from "@/lib/api-client";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/fees")({
  head: () => ({ meta: [{ title: "Fees & Finance · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"overview" | "dues" | "generate" | "categories" | "siblings" | "notifications">("overview");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [collectFeeTarget, setCollectFeeTarget] = useState<any | null>(null);
  const [applyConcessionTarget, setApplyConcessionTarget] = useState<any | null>(null);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [processingSibling, setProcessingSibling] = useState(false);

  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [feesRes, payRes, structRes, classesRes, studentsRes] = await Promise.all([
        apiClient<any>("/fees"),
        apiClient<any>("/fees/payments"),
        apiClient<any>("/fees/structures"),
        apiClient<any>("/academics/classes?limit=100"),
        apiClient<any>("/students?limit=100")
      ]);
      setFeeRecords(feesRes?.data || []);
      setPaymentTransactions(payRes?.data || []);
      setFeeCategories(structRes?.data || []);
      setClasses(classesRes?.data || []);
      setStudents(studentsRes?.data || []);
    } catch (err) {
      toast.error("Failed to load fee data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCollected = feeRecords.reduce((a, f) => a + (f.paidAmount || 0), 0);
  const totalDue = feeRecords.reduce((a, f) => a + ((f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0)), 0);
  const overdue = feeRecords.filter((f) => f.status === "OVERDUE").length;
  const paid = feeRecords.filter((f) => f.status === "PAID").length;

  const pieData = [
    { name: "Collected", value: totalCollected, color: "oklch(0.55 0.15 155)" },
    { name: "Pending", value: totalDue, color: "oklch(0.75 0.15 75)" },
  ];

  const filteredDues = feeRecords.filter((f) => {
    const dueAmount = (f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0);
    const sName = `${f.studentId?.user?.firstName || ''} ${f.studentId?.user?.lastName || ''}`.toLowerCase();
    return dueAmount > 0 && sName.includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader title="Fees & Finance" subtitle="Track collections, dues, and fee categories" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Collected"
          value={`₹${(totalCollected / 100000).toFixed(1)}L`}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Outstanding Dues"
          value={`₹${(totalDue / 100000).toFixed(1)}L`}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Overdue Accounts"
          value={String(overdue)}
          delta="Needs follow-up"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard label="Fully Paid" value={String(paid)} icon={CheckCircle} tone="success" />
      </div>

      <div className="flex flex-wrap gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["overview", "Overview"],
            ["dues", "Outstanding Dues"],
            ["generate", "Generate Invoices"],
            ["categories", "Fee Categories"],
            ["siblings", "Sibling Discounts"],
            ["notifications", "Reminders & Alerts"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Collection Breakdown">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  {d.name}: ₹{(d.value / 100000).toFixed(1)}L
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent Payments">
            {paymentTransactions.length > 0 ? (
              <div className="space-y-3">
                {paymentTransactions.slice(0, 5).map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{p.studentId?.user?.firstName} {p.studentId?.user?.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString()} · {p.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[oklch(0.45_0.15_155)]">
                        ₹{p.amountPaid?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.receiptNumber}</div>
                      <div className="mt-1 flex justify-end gap-2">
                        <button
                          onClick={() => window.open(`${BASE_URL}/v1/invoices/${p._id}/pdf`, "_blank")}
                          className="text-[10px] font-bold text-blue-500 hover:underline"
                        >
                          Tax Invoice
                        </button>
                        {p.status !== "REFUNDED" && (
                          <button
                            onClick={async () => {
                              try {
                                await apiClient(`/fees/refund/${p._id}`, { method: "POST" });
                                toast.success("Refund processed successfully");
                                fetchData();
                              } catch (e) {
                                toast.error("Failed to process refund");
                              }
                            }}
                            className="text-[10px] font-bold text-rose-500 hover:underline"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No payments yet"
                description="Payments will appear here."
              />
            )}
          </Panel>
        </div>
      )}

      {tab === "dues" && (
        <Panel title="Fee Ledger & Collection">
          {/* Student Lookup Search Panel */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Student Ledger & Quick Collection Lookup</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Dropdown search */}
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Lookup by Student Code / Name</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Choose Student Code --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      [{s.admissionNumber || "No Code"}] - {s.user?.firstName} {s.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text code input */}
              <div className="w-full sm:w-64">
                <label className="block text-xs text-muted-foreground mb-1">Direct Student Code Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. STUD001)"
                    id="studentCodeLookupInput"
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const inputVal = (e.target as HTMLInputElement).value.trim();
                        const found = students.find(s => (s.admissionNumber || "").toLowerCase() === inputVal.toLowerCase());
                        if (found) {
                          setSelectedStudentId(found._id);
                          toast.success(`Found student: ${found.user?.firstName} ${found.user?.lastName}`);
                        } else {
                          toast.error("Student code not found");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inputElement = document.getElementById("studentCodeLookupInput") as HTMLInputElement;
                      const inputVal = inputElement?.value.trim();
                      const found = students.find(s => (s.admissionNumber || "").toLowerCase() === inputVal.toLowerCase());
                      if (found) {
                        setSelectedStudentId(found._id);
                        toast.success(`Found student: ${found.user?.firstName} ${found.user?.lastName}`);
                      } else {
                        toast.error("Student code not found");
                      }
                    }}
                    className="h-10 rounded-lg bg-secondary border border-border px-3 text-sm font-semibold hover:bg-muted"
                  >
                    Lookup
                  </button>
                </div>
              </div>

              {selectedStudentId && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedStudentId("");
                      const inputElement = document.getElementById("studentCodeLookupInput") as HTMLInputElement;
                      if (inputElement) inputElement.value = "";
                    }}
                    className="h-10 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 text-sm font-semibold hover:bg-destructive/20"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedStudentId ? (
            (() => {
              const student = students.find((s) => s._id === selectedStudentId);
              const studentFees = feeRecords.filter((f) => f.studentId?._id === selectedStudentId || f.studentId === selectedStudentId);
              const totalAssigned = studentFees.reduce((a, f) => a + (f.amount || 0), 0);
              const totalPaid = studentFees.reduce((a, f) => a + (f.paidAmount || 0), 0);
              const totalDiscount = studentFees.reduce((a, f) => a + (f.discountAmount || 0), 0);
              const remainingBalance = totalAssigned - totalDiscount - totalPaid;

              return (
                <div className="space-y-6">
                  {/* Profile info */}
                  <div className="rounded-xl bg-muted/30 border border-border p-4">
                    <h3 className="text-sm font-semibold mb-3">Student Profile Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">Student Name</span>
                        <span className="font-semibold text-sm">{student?.user?.firstName} {student?.user?.lastName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Admission No / Student Code</span>
                        <span className="font-semibold text-sm">{student?.admissionNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Grade / Section</span>
                        <span className="font-semibold text-sm">
                          {classes.find(c => c._id === student?.classId)?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Roll Number</span>
                        <span className="font-semibold text-sm">{student?.rollNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="text-xs text-muted-foreground">Total Fees Assigned</div>
                      <div className="text-lg font-bold text-foreground mt-1">₹{totalAssigned.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="text-xs text-muted-foreground">Discounts & Concessions</div>
                      <div className="text-lg font-bold text-accent mt-1">₹{totalDiscount.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="text-xs text-muted-foreground">Total Paid</div>
                      <div className="text-lg font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <div className="text-xs text-muted-foreground">Remaining Balance</div>
                      <div className={`text-lg font-bold mt-1 ${remainingBalance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        ₹{remainingBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Table details */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h4 className="font-semibold text-base mb-3">Student Fee Ledger Records</h4>
                    {studentFees.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                              <th className="pb-3 pr-4">Fee Type</th>
                              <th className="pb-3 pr-4">Description</th>
                              <th className="pb-3 pr-4">Total Amount</th>
                              <th className="pb-3 pr-4">Paid Amount</th>
                              <th className="pb-3 pr-4">Discount</th>
                              <th className="pb-3 pr-4">Remaining Due</th>
                              <th className="pb-3 pr-4">Due Date</th>
                              <th className="pb-3 pr-4">Status</th>
                              <th className="pb-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentFees.map((f) => {
                              const due = (f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0);
                              return (
                                <tr key={f._id} className="border-b border-border/50 last:border-0">
                                  <td className="py-3 pr-4 font-medium">{f.feeType}</td>
                                  <td className="py-3 pr-4 text-muted-foreground">{f.description || "N/A"}</td>
                                  <td className="py-3 pr-4">₹{f.amount?.toLocaleString()}</td>
                                  <td className="py-3 pr-4">₹{f.paidAmount?.toLocaleString()}</td>
                                  <td className="py-3 pr-4">₹{(f.discountAmount || 0).toLocaleString()}</td>
                                  <td className={`py-3 pr-4 font-semibold ${due > 0 ? "text-destructive" : "text-emerald-600"}`}>
                                    ₹{due.toLocaleString()}
                                  </td>
                                  <td className="py-3 pr-4 text-muted-foreground">{new Date(f.dueDate).toLocaleDateString()}</td>
                                  <td className="py-3 pr-4">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : f.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                                    >
                                      {f.status}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex gap-2">
                                      {due > 0 && (
                                        <button
                                          onClick={() => setCollectFeeTarget(f)}
                                          className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                                        >
                                          Collect
                                        </button>
                                      )}
                                      {due > 0 && (
                                        <button
                                          onClick={() => setApplyConcessionTarget(f)}
                                          className="rounded bg-secondary border border-border px-3 py-1 text-xs font-semibold hover:bg-muted transition-all"
                                        >
                                          Discount
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-3">No fee records assigned to this student yet.</p>
                        <button
                          onClick={() => setTab("generate")}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Generate/Assign Fee First
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* Global Outstanding Dues list */
            <>
              <div className="mb-4 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student by name..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4">Grade</th>
                      <th className="pb-3 pr-4">Total</th>
                      <th className="pb-3 pr-4">Paid</th>
                      <th className="pb-3 pr-4">Due</th>
                      <th className="pb-3 pr-4">Due Date</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDues.map((f) => {
                      const due = (f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0);
                      return (
                        <tr key={f._id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 pr-4 font-medium">{f.studentId?.user?.firstName} {f.studentId?.user?.lastName}</td>
                          <td className="py-3 pr-4">{f.feeType}</td>
                          <td className="py-3 pr-4">₹{f.amount?.toLocaleString()}</td>
                          <td className="py-3 pr-4">₹{f.paidAmount?.toLocaleString()}</td>
                          <td className="py-3 pr-4 font-medium text-destructive">
                            ₹{due.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{new Date(f.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {due > 0 && (
                                <button
                                  onClick={() => setCollectFeeTarget(f)}
                                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                                >
                                  Collect
                                </button>
                              )}
                              {due > 0 && (
                                <button
                                  onClick={() => setApplyConcessionTarget(f)}
                                  className="rounded bg-secondary border border-border px-3 py-1 text-xs font-semibold hover:bg-muted transition-all"
                                >
                                  Discount
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {filteredDues.map((f) => {
                  const due = (f.amount || 0) - (f.discountAmount || 0) - (f.paidAmount || 0);
                  return (
                    <div key={f._id} className="rounded-lg border border-border p-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{f.studentId?.user?.firstName} {f.studentId?.user?.lastName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Due: ₹{due.toLocaleString()} · By {new Date(f.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        {due > 0 && (
                          <button
                            onClick={() => setCollectFeeTarget(f)}
                            className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 flex-1"
                          >
                            Collect
                          </button>
                        )}
                        {due > 0 && (
                          <button
                            onClick={() => setApplyConcessionTarget(f)}
                            className="rounded bg-secondary border border-border px-3 py-1 text-xs font-semibold hover:bg-muted flex-1"
                          >
                            Discount
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredDues.length === 0 && (
                <EmptyState
                  icon={CheckCircle}
                  title="No outstanding dues"
                  description="All fees are cleared!"
                />
              )}
            </>
          )}
        </Panel>
      )}

      {tab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <Panel title="Class-wide Invoice Run" subtitle="Generate fee records for all active students in a specific grade/class.">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const classId = fd.get("classId") as string;
                const feeStructureId = fd.get("feeStructureId") as string;
                if (!classId || !feeStructureId) {
                  toast.error("Please select a class and fee structure");
                  return;
                }
                try {
                  const res = await apiClient("/fees/generate", {
                    method: "POST",
                    data: { classId, feeStructureId }
                  });
                  toast.success(res?.data?.message || "Class invoices generated successfully");
                  fetchData();
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to generate class invoices");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Select Class</label>
                <select
                  name="classId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.section ? `(${c.section})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Select Fee Structure / Category</label>
                <select
                  name="feeStructureId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Choose Fee Structure --</option>
                  {feeCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.description || c.feeType} - ₹{c.amount?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Generate Class Invoices
              </button>
            </form>
          </Panel>

          <Panel title="Single Student Custom Invoice" subtitle="Assign a specific, customized fee invoice to an individual student.">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const studentId = fd.get("studentId") as string;
                const feeType = fd.get("feeType") as string;
                const amount = Number(fd.get("amount"));
                const dueDateVal = fd.get("dueDate") as string;
                const description = fd.get("description") as string;

                if (!studentId || !feeType || isNaN(amount) || !dueDateVal) {
                  toast.error("Please fill in all required fields");
                  return;
                }

                const dueDate = new Date(dueDateVal).toISOString();

                try {
                  await apiClient("/fees/invoices", {
                    method: "POST",
                    data: { studentId, feeType, amount, dueDate, description }
                  });
                  toast.success("Custom invoice assigned to student");
                  e.currentTarget.reset();
                  fetchData();
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to create custom invoice");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Select Student</label>
                <select
                  name="studentId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.user?.firstName} {s.user?.lastName} (Roll: {s.rollNumber || "N/A"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Fee Type</label>
                  <select
                    name="feeType"
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="TUITION">Tuition Fee</option>
                    <option value="TRANSPORT">Transport Fee</option>
                    <option value="ACTIVITY">Activity Fee</option>
                    <option value="CUSTOM">Custom Fee</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Amount (₹)</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="0"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description (Optional)</label>
                <input
                  name="description"
                  type="text"
                  placeholder="e.g. Laboratory setup charges, uniform fees"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Create & Assign Invoice
              </button>
            </form>
          </Panel>
        </div>
      )}

      {tab === "categories" && (
        <Panel
          title="Fee Categories"
          action={
            <button
              onClick={() => setShowAddCat(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </button>
          }
        >
          <div className="space-y-3">
            {feeCategories.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-accent" />
                  <div>
                    <div className="font-medium text-sm">{c.description || c.feeType}</div>
                    <div className="text-xs text-muted-foreground font-semibold">
                      Type: {c.feeType}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">₹{c.amount?.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      toast.error("Deleting fee structures not implemented in backend API yet");
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "siblings" && (
        <Panel title="Automated Sibling Discounts">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically detect students who share the same parent/guardian and apply a percentage discount to the younger siblings' pending fees.
            </p>
            <div className="flex items-end gap-4 max-w-sm">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Discount Percentage (%)</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                disabled={processingSibling}
                onClick={async () => {
                  try {
                    setProcessingSibling(true);
                    const res = await apiClient("/fees/apply-sibling-discounts", {
                      method: "POST",
                      data: { discountPercentage: discountPercent }
                    });
                    toast.success(res?.data?.message || "Discounts applied");
                    fetchData();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to apply discounts");
                  } finally {
                    setProcessingSibling(false);
                  }
                }}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {processingSibling ? "Processing..." : "Scan & Apply"}
              </button>
            </div>
          </div>
        </Panel>
      )}

      {tab === "notifications" && (
        <div className="space-y-6 animate-fade-in">
          <Panel title="Bulk Overdue Reminders" subtitle="Send immediate push notifications and emails to all parents with pending dues.">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-destructive/5 border border-destructive/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="grid place-content-center h-12 w-12 rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Notify All Outstanding Dues</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will run an automated sweep of all unpaid accounts and dispatch push notifications & emails to their registered parents.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await apiClient("/fees/reminders/overdue", { method: "POST" });
                    toast.success(res?.data?.message || "Bulk overdue reminders dispatched.");
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to dispatch bulk reminders");
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Dispatch Overdue Alerts
              </button>
            </div>
          </Panel>

          <Panel title="Individual Dues Notifications" subtitle="Send targeted reminders to specific parent accounts.">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Fee Description</th>
                    <th className="pb-3 pr-4">Amount Due</th>
                    <th className="pb-3 pr-4">Due Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords
                    .filter((f) => f.status !== "PAID")
                    .map((f) => {
                      const outstandingAmount = f.amount - (f.discountAmount || 0) - (f.paidAmount || 0);
                      return (
                        <tr key={f._id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 pr-4 font-medium">{f.studentId?.user?.firstName} {f.studentId?.user?.lastName}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{f.description || f.feeType}</td>
                          <td className="py-3 pr-4 font-medium">₹{outstandingAmount.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{new Date(f.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                            >
                              {f.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await apiClient(`/fees/${f._id}/reminder`, { method: "POST" });
                                  toast.success(res?.data?.message || "Reminder sent successfully.");
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || "Failed to send reminder");
                                }
                              }}
                              className="rounded bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20 transition-all"
                            >
                              Send Reminder
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {feeRecords
                .filter((f) => f.status !== "PAID")
                .map((f) => {
                  const outstandingAmount = f.amount - (f.discountAmount || 0) - (f.paidAmount || 0);
                  return (
                    <div key={f._id} className="rounded-lg border border-border p-3">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{f.studentId?.user?.firstName} {f.studentId?.user?.lastName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.status === "OVERDUE" ? "bg-destructive/10 text-destructive" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Due: ₹{outstandingAmount.toLocaleString()} · {f.description || f.feeType}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await apiClient(`/fees/${f._id}/reminder`, { method: "POST" });
                            toast.success(res?.data?.message || "Reminder sent successfully.");
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || "Failed to send reminder");
                          }
                        }}
                        className="w-full rounded bg-accent/10 border border-accent/20 py-1 text-xs font-semibold text-accent hover:bg-accent/20 animate-pulse"
                      >
                        Send Reminder
                      </button>
                    </div>
                  );
                })}
            </div>
          </Panel>
        </div>
      )}

      {showAddCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAddCat(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Fee Category</h2>
              <button
                onClick={() => setShowAddCat(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const classId = fd.get("classId") as string;
                const feeType = fd.get("feeType") as string;
                const amount = Number(fd.get("amount"));
                const dueDateVal = fd.get("dueDate") as string;
                const description = fd.get("description") as string;

                if (!classId || !feeType || isNaN(amount) || !dueDateVal || !description) {
                  toast.error("Please fill in all fields");
                  return;
                }

                try {
                  await apiClient("/fees/structures", {
                    method: "POST",
                    data: {
                      classId,
                      feeType,
                      amount,
                      dueDate: new Date(dueDateVal).toISOString(),
                      description
                    }
                  });
                  toast.success("Category added");
                  setShowAddCat(false);
                  fetchData();
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to add category");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Select Class</label>
                <select
                  name="classId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.section ? `(${c.section})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fee Type</label>
                <select
                  name="feeType"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="TUITION">Tuition Fee</option>
                  <option value="TRANSPORT">Transport Fee</option>
                  <option value="ACTIVITY">Activity Fee</option>
                  <option value="EXAM">Exam Fee</option>
                  <option value="CUSTOM">Custom Fee</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount (₹)</label>
                <input
                  name="amount"
                  type="number"
                  required
                  min="0"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Default Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category Description / Name</label>
                <input
                  name="description"
                  required
                  placeholder="e.g. Tuition Fee for Class 10"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {collectFeeTarget && (
        <CollectFeeModal
          feeRecord={collectFeeTarget}
          onClose={() => setCollectFeeTarget(null)}
          onRefresh={fetchData}
        />
      )}

      {applyConcessionTarget && (
        <ConcessionModal
          feeRecord={applyConcessionTarget}
          onClose={() => setApplyConcessionTarget(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

function CollectFeeModal({
  feeRecord,
  onClose,
  onRefresh,
}: {
  feeRecord: any;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [fragments, setFragments] = useState([{ method: "CASH", amount: feeRecord.amount - (feeRecord.paidAmount || 0) - (feeRecord.discountAmount || 0) }]);
  const [loading, setLoading] = useState(false);

  const totalFragmentAmount = fragments.reduce((sum, f) => sum + f.amount, 0);

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (fragments.length > 1) {
        await apiClient("/fees/manual-payment", {
          method: "POST",
          data: {
            feeId: feeRecord._id,
            amountPaid: totalFragmentAmount,
            paymentMethod: "SPLIT",
            fragments: fragments.map(f => ({
              method: f.method,
              amount: f.amount
            })),
            remarks: "Split Manual Payment Collection"
          }
        });
      } else {
        const frag = fragments[0];
        await apiClient("/fees/manual-payment", {
          method: "POST",
          data: {
            feeId: feeRecord._id,
            amountPaid: frag.amount,
            paymentMethod: frag.method,
            remarks: "Manual Payment Collection"
          }
        });
      }

      toast.success("Fee collected successfully");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error("Failed to collect fee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border"
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Collect Fee</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Student: <span className="font-medium text-foreground">{feeRecord.studentId?.user?.firstName} {feeRecord.studentId?.user?.lastName}</span>
        </div>
        <form onSubmit={handleCollect} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Payment Fragments (Split Payment)</label>
              <button
                type="button"
                onClick={() => setFragments([...fragments, { method: "CASH", amount: 0 }])}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Split
              </button>
            </div>
            {fragments.map((frag, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={frag.method}
                  onChange={(e) => {
                    const nf = [...fragments];
                    nf[idx].method = e.target.value;
                    setFragments(nf);
                  }}
                  className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
                <input
                  type="number"
                  value={frag.amount}
                  onChange={(e) => {
                    const nf = [...fragments];
                    nf[idx].amount = Number(e.target.value);
                    setFragments(nf);
                  }}
                  className="h-10 w-24 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {fragments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setFragments(fragments.filter((_, i) => i !== idx))}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-border font-bold">
            <span>Total to Collect:</span>
            <span className="text-accent">₹{totalFragmentAmount.toLocaleString()}</span>
          </div>

          <button
            type="submit"
            disabled={loading || totalFragmentAmount <= 0}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Complete Payment Collection"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConcessionModal({
  feeRecord,
  onClose,
  onRefresh,
}: {
  feeRecord: any;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<"CONCESSION" | "SCHOLARSHIP">("SCHOLARSHIP");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }
    try {
      setLoading(true);
      await apiClient(`/fees/${feeRecord._id}/scholarships`, {
        method: "POST",
        data: {
          type,
          amount,
          reason,
        }
      });
      toast.success("Scholarship/Concession applied successfully");
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const outstanding = feeRecord.amount - (feeRecord.paidAmount || 0) - (feeRecord.discountAmount || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border"
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Apply Scholarship/Concession</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          <div>
            Student: <span className="font-semibold text-foreground">{feeRecord.studentId?.user?.firstName} {feeRecord.studentId?.user?.lastName}</span>
          </div>
          <div>
            Remaining Outstanding: <span className="font-semibold text-foreground">₹{outstanding.toLocaleString()}</span>
          </div>
        </div>
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="SCHOLARSHIP">Scholarship</option>
              <option value="CONCESSION">Concession</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Concession Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={outstanding}
              min={1}
              required
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason / Remarks</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Merit Scholarship, Sibling Concession"
              required
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Applying..." : "Apply Discount"}
          </button>
        </form>
      </div>
    </div>
  );
}
