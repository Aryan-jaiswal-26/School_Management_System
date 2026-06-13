import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Clock, Wallet, CalendarDays, Loader2, Star, UserPlus, Download, RefreshCw, FileText, Check, Calendar } from "lucide-react";
import { PageHeader, StatCard, Panel } from "@/components/module-shell";
import { apiClient, API_BASE_URL } from "@/lib/api-client";

export const Route = createFileRoute("/admin/hr")({
  head: () => ({ meta: [{ title: "HR & Payroll · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"leave" | "payroll" | "attendance" | "performance" | "substitute">("leave");
  const [staff, setStaff] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [checkInMap, setCheckInMap] = useState<Record<string, string>>({});
  const [checkOutMap, setCheckOutMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Payroll states
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(() => new Date().getFullYear());
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [showGenerateSalary, setShowGenerateSalary] = useState(false);
  const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<any | null>(null);
  const [salaryAllowances, setSalaryAllowances] = useState<number>(0);
  const [salaryDeductions, setSalaryDeductions] = useState<number>(0);
  const [generatingSalary, setGeneratingSalary] = useState(false);

  const fetchStats = async () => {
    try {
      const res: any = await apiClient("/employees/dashboard/stats");
      setStats(res?.data || res);
    } catch {}
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient("/employees");
      setStaff(res?.data || []);
    } catch (err) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res: any = await apiClient("/leaves");
      setLeaveRequests(res?.data || []);
    } catch {}
  };

  const fetchHRData = async () => {
    try {
      const [perfRes, subRes] = await Promise.all([
        apiClient<any>("/performance"),
        apiClient<any>("/substitutes")
      ]);
      setPerformanceReviews(perfRes?.data || []);
      setSubstitutes(subRes?.data || []);
    } catch {}
  };

  const fetchSalaries = async (month: number, year: number) => {
    try {
      const res: any = await apiClient(`/employees/salaries/list?month=${month}&year=${year}`);
      setSalaryRecords(res?.data || res || []);
    } catch {}
  };

  const fetchAttendanceForDate = async (dateStr: string) => {
    try {
      const res: any = await apiClient(`/employees/attendance/date?date=${dateStr}`);
      const data = res?.data || res || [];
      const newAttMap: Record<string, string> = {};
      const newCheckInMap: Record<string, string> = {};
      const newCheckOutMap: Record<string, string> = {};
      const newRemarksMap: Record<string, string> = {};
      
      data.forEach((rec: any) => {
        newAttMap[rec.employeeId] = rec.status;
        if (rec.checkInTime) {
          newCheckInMap[rec.employeeId] = new Date(rec.checkInTime).toTimeString().slice(0, 5);
        }
        if (rec.checkOutTime) {
          newCheckOutMap[rec.employeeId] = new Date(rec.checkOutTime).toTimeString().slice(0, 5);
        }
        if (rec.remarks) {
          newRemarksMap[rec.employeeId] = rec.remarks;
        }
      });
      
      setAttendanceMap(newAttMap);
      setCheckInMap(newCheckInMap);
      setCheckOutMap(newCheckOutMap);
      setRemarksMap(newRemarksMap);
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchLeaves();
    fetchHRData();
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === "payroll") {
      fetchSalaries(payrollMonth, payrollYear);
    } else if (tab === "attendance") {
      fetchAttendanceForDate(attendanceDate);
    }
  }, [tab, payrollMonth, payrollYear, attendanceDate]);

  const handleLeaveAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await apiClient(`/leaves/${id}`, { method: "PATCH", data: { status } });
      setLeaveRequests(prev => prev.map((l: any) => l._id === id || l.id === id ? { ...l, status } : l));
      toast.success(`Leave ${status}`, { description: `Leave request has been ${status}.` });
      fetchStats();
      fetchStaff();
    } catch {
      toast.error("Failed to update leave request");
    }
  };

  const saveAttendance = async () => {
    try {
      setSavingAttendance(true);
      const records = staff.map((s) => {
        const status = attendanceMap[s._id] || "PRESENT";
        const checkIn = checkInMap[s._id];
        const checkOut = checkOutMap[s._id];
        const remarks = remarksMap[s._id];
        
        let checkInTime: string | undefined;
        let checkOutTime: string | undefined;
        
        if (checkIn) {
          checkInTime = new Date(`${attendanceDate}T${checkIn}:00`).toISOString();
        }
        if (checkOut) {
          checkOutTime = new Date(`${attendanceDate}T${checkOut}:00`).toISOString();
        }
        
        return {
          employeeId: s._id,
          status,
          checkInTime,
          checkOutTime,
          remarks
        };
      });
      
      await apiClient("/employees/attendance/bulk", {
        method: "POST",
        data: {
          date: attendanceDate,
          records
        }
      });
      
      toast.success("Daily attendance saved successfully");
      fetchStats();
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleGenerateSalary = async () => {
    if (!selectedStaffForSalary) return;
    try {
      setGeneratingSalary(true);
      await apiClient("/employees/salaries/generate", {
        method: "POST",
        data: {
          employeeId: selectedStaffForSalary._id,
          month: payrollMonth,
          year: payrollYear,
          allowances: Number(salaryAllowances || 0),
          deductions: Number(salaryDeductions || 0)
        }
      });
      toast.success("Salary record generated successfully");
      setShowGenerateSalary(false);
      setSelectedStaffForSalary(null);
      setSalaryAllowances(0);
      setSalaryDeductions(0);
      fetchSalaries(payrollMonth, payrollYear);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate salary");
    } finally {
      setGeneratingSalary(false);
    }
  };

  const updateSalaryStatus = async (id: string, status: string) => {
    try {
      await apiClient(`/employees/salaries/${id}/status`, {
        method: "PATCH",
        data: { status }
      });
      toast.success("Salary status updated successfully");
      fetchSalaries(payrollMonth, payrollYear);
    } catch {
      toast.error("Failed to update salary status");
    }
  };

  const downloadPayslip = async (id: string, empId: string) => {
    try {
      const url = `${API_BASE_URL}/employees/salaries/${id}/download`;
      window.open(url, "_blank");
      toast.success("Payslip PDF download initiated");
    } catch {
      toast.error("Failed to download payslip");
    }
  };

  const activeStaffCount = stats?.totalStaff !== undefined ? stats.totalStaff : staff.filter((s) => s.isActive).length;
  const presentTodayCount = stats?.presentToday !== undefined ? stats.presentToday : 0;
  const absentTodayCount = stats?.absentToday !== undefined ? stats.absentToday : 0;
  const onLeaveCount = stats?.onLeave !== undefined ? stats.onLeave : staff.filter((s) => s.employmentStatus === "ON_LEAVE").length;
  const pendingLeavesCount = stats?.pendingLeaveRequests !== undefined ? stats.pendingLeaveRequests : leaveRequests.filter((l: any) => l.status === "pending").length;
  const totalPayrollAmount = stats?.monthlyPayroll !== undefined ? stats.monthlyPayroll : staff.reduce((a, s) => a + (s.basicSalary || 0), 0);

  const tabs = [
    { key: "leave" as const, label: "Leave Requests", icon: CalendarDays },
    { key: "payroll" as const, label: "Payroll", icon: Wallet },
    { key: "attendance" as const, label: "Staff Attendance", icon: Users },
    { key: "performance" as const, label: "Performance", icon: Star },
    { key: "substitute" as const, label: "Substitutes", icon: UserPlus },
  ];

  return (
    <div>
      <PageHeader title="HR & Payroll" subtitle="Staff management, leave approvals, and payroll" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total Staff" value={String(activeStaffCount)} icon={Users} tone="info" />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border rounded-xl p-3 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Present Today</span>
            <span className="text-lg font-bold text-[oklch(0.45_0.15_155)]">{presentTodayCount}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Absent Today</span>
            <span className="text-lg font-bold text-destructive">{absentTodayCount}</span>
          </div>
        </div>
        <StatCard label="On Leave" value={String(onLeaveCount)} icon={CalendarDays} tone="warning" />
        <StatCard
          label="Pending Leaves"
          value={String(pendingLeavesCount)}
          delta="Needs action"
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all shrink-0 ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "leave" && (
        <Panel title="Leave Requests">
          <div className="space-y-3">
            {leaveRequests.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">No leave requests found.</div>
            )}
            {leaveRequests.map((l: any) => (
              <div
                key={l._id || l.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <div className="font-medium text-foreground">{l.staffName || `${l.employee?.user?.firstName || ""} ${l.employee?.user?.lastName || ""}`.trim() || "Staff"}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.type || l.leaveType} · {new Date(l.from || l.startDate).toLocaleDateString()} to {new Date(l.to || l.endDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{l.reason}</div>
                </div>
                <div className="flex items-center gap-2">
                  {l.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleLeaveAction(l._id || l.id, "approved")}
                        className="flex items-center gap-1 rounded-lg bg-[oklch(0.65_0.15_155)]/15 px-3 py-1.5 text-xs font-medium text-[oklch(0.45_0.15_155)] hover:bg-[oklch(0.65_0.15_155)]/25 transition-all active:scale-95"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(l._id || l.id, "rejected")}
                        className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all active:scale-95"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${l.status === "approved" ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-destructive/10 text-destructive"}`}
                    >
                      {l.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "payroll" && (
        <Panel title="Payroll Calculations">
          <div className="flex flex-wrap items-center gap-3 mb-6 bg-muted/40 p-4 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Select Month</label>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(Number(e.target.value))}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Select Year</label>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(Number(e.target.value))}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total Payroll Amount</div>
                <div className="text-xl font-bold text-foreground">₹{totalPayrollAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Staff Name</th>
                  <th className="pb-3 pr-4">Designation</th>
                  <th className="pb-3 pr-4">Basic Pay</th>
                  <th className="pb-3 pr-4">Allowances / Deductions</th>
                  <th className="pb-3 pr-4">Net Salary</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const record = salaryRecords.find((r) => r.employeeId?._id === s._id || r.employeeId === s._id);
                  return (
                    <tr key={s._id} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                      <td className="py-3 pr-4 font-medium">{s.user?.firstName} {s.user?.lastName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.designation}</td>
                      <td className="py-3 pr-4 font-semibold">₹{(s.basicSalary || 0).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        {record ? (
                          <span className="text-xs">
                            +₹{record.allowances} / -₹{record.deductions}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-bold text-primary">
                        {record ? `₹${record.netSalary.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {record ? (
                          <select
                            value={record.status}
                            onChange={(e) => updateSalaryStatus(record._id, e.target.value)}
                            className={`rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold ${
                              record.status === "PAID"
                                ? "text-[oklch(0.45_0.15_155)] bg-[oklch(0.65_0.15_155)]/10 border-[oklch(0.65_0.15_155)]/35"
                                : record.status === "PROCESSED"
                                ? "text-blue-600 bg-blue-50 border-blue-200"
                                : "text-amber-600 bg-amber-50 border-amber-200"
                            }`}
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="PROCESSED">Processed</option>
                            <option value="PAID">Paid</option>
                          </select>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium">Uncalculated</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {record ? (
                          <button
                            onClick={() => downloadPayslip(record._id, s.employeeId)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted active:scale-95 transition-all shadow-sm"
                            title="Download Payslip PDF"
                          >
                            <Download className="h-3.5 w-3.5 text-primary" /> Payslip
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStaffForSalary(s);
                              setShowGenerateSalary(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Calculate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Generate Salary Modal */}
          {showGenerateSalary && selectedStaffForSalary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <h3 className="text-lg font-bold text-foreground">Calculate Payroll</h3>
                  <button onClick={() => { setShowGenerateSalary(false); setSelectedStaffForSalary(null); }} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff Member</label>
                    <div className="mt-1 text-sm font-bold">{selectedStaffForSalary.user?.firstName} {selectedStaffForSalary.user?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{selectedStaffForSalary.designation} · {selectedStaffForSalary.employeeId}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Pay</label>
                    <div className="mt-1 text-sm font-semibold text-primary">₹{(selectedStaffForSalary.basicSalary || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Allowances (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={salaryAllowances}
                      onChange={(e) => setSalaryAllowances(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Manual Deductions (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={salaryDeductions}
                      onChange={(e) => setSalaryDeductions(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      * Daily attendance deductions will be calculated automatically and added.
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                  <button
                    onClick={() => { setShowGenerateSalary(false); setSelectedStaffForSalary(null); }}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateSalary}
                    disabled={generatingSalary}
                    className="px-4 py-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingSalary && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generate Pay Slip
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      )}

      {tab === "attendance" && (
        <Panel title="Daily Staff Attendance">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent font-medium"
                />
              </div>
              <div>
                <button
                  onClick={saveAttendance}
                  disabled={savingAttendance}
                  className="h-10 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 active:scale-95 transition-all shadow-md"
                >
                  {savingAttendance && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" /> Save Attendance
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Staff ID</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Role / Dept</th>
                    <th className="pb-3 pr-4 text-center">Status</th>
                    <th className="pb-3 pr-4">Check-In / Out</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => {
                    const currentStatus = attendanceMap[s._id] || "PRESENT";
                    const checkIn = checkInMap[s._id] || "";
                    const checkOut = checkOutMap[s._id] || "";
                    const remarks = remarksMap[s._id] || "";
                    return (
                      <tr key={s._id} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{s.employeeId}</td>
                        <td className="py-3 pr-4 font-medium">{s.user?.firstName} {s.user?.lastName}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {s.designation} · {s.department || "N/A"}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-center gap-1 bg-muted/50 p-1 rounded-lg border border-border w-max mx-auto">
                            {(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => setAttendanceMap(prev => ({ ...prev, [s._id]: st }))}
                                className={`rounded px-2.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                                  currentStatus === st
                                    ? st === "PRESENT"
                                      ? "bg-[oklch(0.65_0.15_155)] text-white shadow-sm"
                                      : st === "ABSENT"
                                      ? "bg-destructive text-white shadow-sm"
                                      : st === "LATE"
                                      ? "bg-amber-500 text-white shadow-sm"
                                      : st === "HALF_DAY"
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : "bg-indigo-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                                }`}
                              >
                                {st === "ON_LEAVE" ? "Leave" : st.toLowerCase().replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-2 items-center">
                            <input
                              type="time"
                              value={checkIn}
                              onChange={(e) => setCheckInMap(prev => ({ ...prev, [s._id]: e.target.value }))}
                              className="h-8 w-24 rounded border border-border bg-card px-1.5 text-xs outline-none"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <input
                              type="time"
                              value={checkOut}
                              onChange={(e) => setCheckOutMap(prev => ({ ...prev, [s._id]: e.target.value }))}
                              className="h-8 w-24 rounded border border-border bg-card px-1.5 text-xs outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-3">
                          <input
                            value={remarks}
                            onChange={(e) => setRemarksMap(prev => ({ ...prev, [s._id]: e.target.value }))}
                            placeholder="Add remarks..."
                            className="h-8 w-full min-w-[120px] rounded border border-border bg-card px-2 text-xs outline-none focus:border-accent"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {tab === "performance" && (
        <Panel title="Performance Reviews" action={<button onClick={() => {
          const empId = prompt("Enter Employee ID to review:");
          if (!empId) return;
          apiClient("/performance", {
            method: "POST",
            data: {
              employeeId: empId,
              reviewPeriod: "2026-Q2",
              rating: Number(prompt("Rating (1-5):", "4") || "4"),
              comments: prompt("Comments:", "Good performance") || ""
            }
          }).then(() => toast.success("Review Added")).catch(() => toast.error("Failed to add review"));
        }} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><Star className="h-3 w-3" /> Add Review</button>}>
          <div className="space-y-3">
            {performanceReviews.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No reviews yet</div>}
            {performanceReviews.map(r => (
              <div key={r._id} className="p-4 rounded-lg border border-border flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">Emp ID: {r.employeeId?._id || r.employeeId}</div>
                  <div className="text-xs text-muted-foreground">Period: {r.reviewPeriod}</div>
                  <div className="text-sm mt-1">"{r.comments}"</div>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {r.rating}/5
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "substitute" && (
        <Panel title="Substitute Teacher Mapping" action={<button onClick={() => {
          apiClient("/substitutes", {
            method: "POST",
            data: {
              absentTeacherId: prompt("Absent Teacher ID:"),
              substituteTeacherId: prompt("Substitute Teacher ID:"),
              date: new Date().toISOString(),
              periodOrClass: prompt("Period/Class (e.g., Grade 5 Math):", "Grade 5 Math")
            }
          }).then(() => toast.success("Substitute Assigned")).catch(() => toast.error("Failed to assign substitute"));
        }} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><UserPlus className="h-3 w-3" /> Assign Substitute</button>}>
          <div className="space-y-3">
            {substitutes.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No substitutes assigned</div>}
            {substitutes.map(s => (
              <div key={s._id} className="p-4 rounded-lg border border-border flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">Class: {s.periodOrClass}</div>
                  <div className="text-xs text-muted-foreground">Date: {new Date(s.date).toLocaleDateString()}</div>
                  <div className="text-xs mt-1">
                    <span className="text-destructive font-medium">Absent:</span> {s.absentTeacherId?._id || s.absentTeacherId} <br/>
                    <span className="text-emerald-600 font-medium">Sub:</span> {s.substituteTeacherId?._id || s.substituteTeacherId}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
