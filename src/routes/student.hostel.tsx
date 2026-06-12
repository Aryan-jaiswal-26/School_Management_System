import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Calendar, Plus, Users, CheckCircle, X, DollarSign } from "lucide-react";

export const Route = createFileRoute("/student/hostel")({
  head: () => ({ meta: [{ title: "Hostel · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"room" | "leaves" | "complaints" | "bills" | "notices">("room");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [allocation, setAllocation] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  const fetchData = async () => {
    if (!user?.studentId) return;
    try {
      const [lRes, cRes, nRes, aRes, iRes] = await Promise.all([
        apiClient<any>("/hostel/leaves"),
        apiClient<any>("/hostel/complaints"),
        apiClient<any>("/hostel/notices"),
        apiClient<any>(`/hostel/allocations?studentId=${user.studentId}`),
        apiClient<any>(`/hostel/fees/invoices?studentId=${user.studentId}`)
      ]);
      setLeaves(Array.isArray(lRes) ? lRes : lRes?.data || []);
      setComplaints(Array.isArray(cRes) ? cRes : cRes?.data || []);
      setNotices(Array.isArray(nRes) ? nRes : nRes?.data || []);
      
      const allocList = Array.isArray(aRes) ? aRes : aRes?.data || [];
      const activeAlloc = allocList.find((a: any) => a.status === "Active");
      setAllocation(activeAlloc || null);

      setInvoices(Array.isArray(iRes) ? iRes : iRes?.data || []);
    } catch (err) {
      toast.error("Failed to load hostel data");
    }
  };

  useEffect(() => {
    if (user?.studentId) {
      fetchData();
    }
  }, [user?.studentId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Hostel Block"
        subtitle="View your room allotment details, register leaves/gatepasses, and manage fee billing invoices."
      />

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["room", "My Room"],
            ["leaves", "Gatepass"],
            ["complaints", "Complaints"],
            ["bills", "Hostel Bills"],
            ["notices", "Notices"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "room" && (
        <Panel title="Room Details">
          {allocation ? (
            <div className="rounded-xl border border-border p-6 shadow-sm bg-card max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {allocation.hostelId?.buildingName || 'Block'} · Room {allocation.roomId?.roomNumber || '—'}
                </h3>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-semibold">Allocated</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hostel Block</span>
                  <span className="font-semibold text-foreground">{allocation.hostelId?.hostelName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floor</span>
                  <span className="font-semibold text-foreground">Floor {allocation.floorId?.floorNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bed Slot</span>
                  <span className="font-semibold text-foreground">Bed #{allocation.bedId?.bedNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in Date</span>
                  <span className="font-semibold text-foreground">{new Date(allocation.checkInDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="No room allocated" description="You do not currently have any active hostel room allotments." />
          )}
        </Panel>
      )}

      {tab === "leaves" && (
        <Panel
          title="My Gatepasses"
          action={
            <button onClick={() => setShowLeaveForm(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Plus className="h-4 w-4" /> Apply for Gatepass
            </button>
          }
        >
          <div className="space-y-3">
            {leaves.map((l) => (
              <div key={l.id || l._id} className="rounded-lg border border-border p-4 bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{l.reason}</div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${l.status === 'pending' ? 'bg-amber-100 text-amber-800' : l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                    {l.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Out: {new Date(l.outTime).toLocaleString()} <br/> Expected In: {new Date(l.expectedInTime).toLocaleString()}
                </div>
              </div>
            ))}
            {leaves.length === 0 && <EmptyState icon={Calendar} title="No active gatepasses" description="Apply for a gatepass to leave the campus." />}
          </div>
        </Panel>
      )}

      {tab === "bills" && (
        <Panel title="My Hostel Bills & Dues">
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv._id || inv.id} className="p-4 border border-border rounded-xl bg-card flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-foreground">{inv.feePlanId?.name || 'Hostel Fee'}</div>
                  <div className="text-xs text-muted-foreground">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">₹{inv.amount}</div>
                  <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <EmptyState icon={DollarSign} title="No pending bills" description="You have no outstanding hostel billing invoices." />
            )}
          </div>
        </Panel>
      )}

      {tab === "notices" && (
        <Panel title="Hostel Notices">
          <div className="grid grid-cols-1 gap-4">
            {notices.map((n) => (
              <div key={n.id || n._id} className="rounded-lg border border-border p-4 bg-card">
                <h3 className="font-semibold">{n.title}</h3>
                <div className="text-xs text-muted-foreground mb-2">{new Date(n.createdAt).toLocaleDateString()}</div>
                <p className="text-sm">{n.content}</p>
              </div>
            ))}
            {notices.length === 0 && <EmptyState icon={AlertCircle} title="No notices" description="There are no recent notices from the warden." />}
          </div>
        </Panel>
      )}

      {tab === "complaints" && (
        <Panel
          title="My Complaints"
          action={
            <button onClick={() => setShowComplaintForm(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Plus className="h-4 w-4" /> Log Complaint
            </button>
          }
        >
          <div className="space-y-3">
            {complaints.filter(c => (c.studentId === user?.id || c.student_id === user?.id)).map((c) => (
              <div key={c.id || c._id} className="rounded-lg border border-border p-4 bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold capitalize">{c.category} Issue</div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                    c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{c.description}</div>
              </div>
            ))}
            {complaints.filter(c => (c.studentId === user?.id || c.student_id === user?.id)).length === 0 && (
              <EmptyState icon={CheckCircle} title="No complaints logged" description="You have not registered any hostel complaints." />
            )}
          </div>
        </Panel>
      )}

      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowLeaveForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Apply for Gatepass</h2>
              <button onClick={() => setShowLeaveForm(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await apiClient("/hostel/leaves", {
                    method: "POST",
                    data: {
                      outTime: new Date(fd.get("outTime") as string).toISOString(),
                      expectedInTime: new Date(fd.get("inTime") as string).toISOString(),
                      reason: fd.get("reason"),
                    }
                  });
                  toast.success("Gatepass request submitted");
                  setShowLeaveForm(false);
                  fetchData();
                } catch (err) {
                  toast.error("Failed to submit request");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Out Time</label>
                <input name="outTime" type="datetime-local" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Expected In Time</label>
                <input name="inTime" type="datetime-local" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reason</label>
                <textarea name="reason" required rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm"></textarea>
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {showComplaintForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowComplaintForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Log Hostel Complaint</h2>
              <button onClick={() => setShowComplaintForm(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  await apiClient("/hostel/complaints", {
                    method: "POST",
                    data: {
                      student_name: user?.name || "Student",
                      room: allocation?.roomId?.roomNumber || "N/A",
                      category: fd.get("category"),
                      description: fd.get("description"),
                      status: "open"
                    }
                  });
                  toast.success("Complaint logged successfully!");
                  setShowComplaintForm(false);
                  fetchData();
                } catch (err) {
                  toast.error("Failed to log complaint");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Issue Category</label>
                <select name="category" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning / Housekeeping</option>
                  <option value="security">Security</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea name="description" required rows={4} className="w-full rounded-lg border border-border bg-background p-3 text-sm" placeholder="Explain the issue in detail..."></textarea>
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Submit Complaint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
