import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Building2,
  Users,
  AlertTriangle,
  Wrench,
  Plus,
  X,
  Eye,
  CheckCircle,
  Phone,
  ShieldAlert,
  Zap,
  Wifi,
  Check,
  AlertCircle,
  Trash2,
  ListPlus,
  RefreshCw,
  Search,
  DollarSign,
  UserCheck,
  Calendar,
  LogOut,
  LogIn,
  ClipboardList,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/hostel")({
  head: () => ({ meta: [{ title: "Hostel Management · Campus OS" }] }),
  component: Page,
});

type TabName = "dashboard" | "hostels" | "structure" | "allotments" | "fees" | "attendance" | "movement" | "visitors" | "complaints" | "reports";

function Page() {
  const [tab, setTab] = useState<TabName>("dashboard");
  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState<any[]>([]);
  const [activeHostelId, setActiveHostelId] = useState<string>("");
  const [numFloors, setNumFloors] = useState(1);
  const [floorConfig, setFloorConfig] = useState<{ roomsCount: number; bedsPerRoom: number }[]>([
    { roomsCount: 5, bedsPerRoom: 4 }
  ]);
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showFeePlanModal, setShowFeePlanModal] = useState(false);
  const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showWardenMsgModal, setShowWardenMsgModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // States for all modules
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [feePlans, setFeePlans] = useState<any[]>([]);
  const [feeInvoices, setFeeInvoices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalHostels: 0,
    totalFloors: 0,
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyPct: 0,
    openComplaints: 0,
    pendingFees: 0,
    totalCollected: 0
  });

  // Allotment Select Filters
  const [selectedAllotmentHostelId, setSelectedAllotmentHostelId] = useState<string>("");
  const [selectedAllotmentFloorId, setSelectedAllotmentFloorId] = useState<string>("");
  const [selectedAllotmentRoomId, setSelectedAllotmentRoomId] = useState<string>("");
  const [selectedAllotmentClass, setSelectedAllotmentClass] = useState<string>("");
  const [selectedAllotmentDiv, setSelectedAllotmentDiv] = useState<string>("");

  // Fee Filters
  const [feeFilterHostelId, setFeeFilterHostelId] = useState<string>("");
  const [feeFilterStatus, setFeeFilterStatus] = useState<string>("");
  const [feeFilterStudentSearch, setFeeFilterStudentSearch] = useState<string>("");

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSession, setAttendanceSession] = useState<"morning" | "evening" | "night">("evening");
  const [presentBeds, setPresentBeds] = useState<Record<string, boolean>>({});

  // Filter terms
  const [studentSearch, setStudentSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        hRes,
        flRes,
        rRes,
        bRes,
        alRes,
        sRes,
        cRes,
        vRes,
        lRes,
        atRes,
        nRes,
        fpRes,
        fiRes,
        mRes,
        anRes
      ] = await Promise.all([
        apiClient<any>("/hostel"),
        apiClient<any>("/hostel/structure?entity=floors").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/rooms").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/structure?entity=beds").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/allocations").catch(() => ({ data: [] })),
        apiClient<any>("/students").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/complaints"),
        apiClient<any>("/hostel/visitors"),
        apiClient<any>("/hostel/leaves"),
        apiClient<any>("/hostel/attendance"),
        apiClient<any>("/hostel/notices"),
        apiClient<any>("/hostel/fees/plans").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/fees/invoices").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/messages").catch(() => ({ data: [] })),
        apiClient<any>("/hostel/analytics").catch(() => ({ data: {} }))
      ]);

      setHostels(Array.isArray(hRes) ? hRes : hRes?.data || []);
      setComplaints(Array.isArray(cRes) ? cRes : cRes?.data || []);
      setVisitors(Array.isArray(vRes) ? vRes : vRes?.data || []);
      setLeaves(Array.isArray(lRes) ? lRes : lRes?.data || []);
      setAttendance(Array.isArray(atRes) ? atRes : atRes?.data || []);
      setNotices(Array.isArray(nRes) ? nRes : nRes?.data || []);
      
      // Extended models fallback lists
      setFloors(flRes?.data || []);
      setRooms(rRes?.data || []);
      setBeds(bRes?.data || []);
      setAllocations(alRes?.data || []);
      setStudents(Array.isArray(sRes) ? sRes : sRes?.data || []);
      setFeePlans(fpRes?.data || []);
      setFeeInvoices(fiRes?.data || []);
      setMessages(mRes?.data || []);
      
      if (anRes?.data) {
        setAnalytics(anRes.data);
      }
    } catch (err) {
      toast.error("Failed to load hostel configuration and data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set first hostel active if none selected
  useEffect(() => {
    if (hostels.length > 0 && !activeHostelId) {
      setActiveHostelId(hostels[0]._id || hostels[0].id);
    }
  }, [hostels]);

  // Adjust floor configurations size when floors count changes
  const handleFloorsCountChange = (val: number) => {
    const num = Math.max(1, Math.min(10, val));
    setNumFloors(num);
    setFloorConfig((prev) => {
      const copy = [...prev];
      if (copy.length < num) {
        while (copy.length < num) {
          copy.push({ roomsCount: 5, bedsPerRoom: 4 });
        }
      } else if (copy.length > num) {
        copy.splice(num);
      }
      return copy;
    });
  };

  const handleFloorRoomChange = (idx: number, field: "roomsCount" | "bedsPerRoom", val: number) => {
    setFloorConfig((prev) => {
      const copy = [...prev];
      copy[idx][field] = Math.max(1, val);
      return copy;
    });
  };

  // Generate Structure
  const handleGenerateStructure = async () => {
    if (!activeHostelId) {
      toast.error("Please select a hostel block first.");
      return;
    }

    try {
      const payload = {
        hostelId: activeHostelId,
        floors: floorConfig.map((f, i) => ({
          floorNumber: i + 1,
          roomsCount: f.roomsCount,
          bedsPerRoom: f.bedsPerRoom
        }))
      };

      await apiClient("/hostel/structure", {
        method: "POST",
        data: payload
      });

      toast.success("Hostel floor and room structure configured successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to generate structure.");
    }
  };

  // Create Hostel
  const handleCreateHostel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const bName = fd.get("buildingName");
      await apiClient("/hostel", {
        method: "POST",
        data: {
          hostelName: bName,
          hostelType: fd.get("hostelType"),
          buildingName: bName,
          wardenName: fd.get("wardenName"),
          wardenContact: fd.get("wardenContact"),
          description: fd.get("description"),
          status: "Active"
        }
      });
      toast.success("Hostel created successfully!");
      setShowHostelModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to create hostel.");
    }
  };

  // Create Fee Plan
  const handleCreateFeePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/fees/plans", {
        method: "POST",
        data: {
          name: fd.get("name"),
          hostelId: fd.get("hostelId"),
          billingCycle: fd.get("billingCycle"),
          amount: Number(fd.get("amount")),
          lateFee: Number(fd.get("lateFee") || 0)
        }
      });
      toast.success("Fee plan created!");
      setShowFeePlanModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to create fee plan.");
    }
  };

  // Issue Invoice
  const handleIssueInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/fees/invoices", {
        method: "POST",
        data: {
          studentId: fd.get("studentId"),
          feePlanId: fd.get("feePlanId"),
          dueDate: fd.get("dueDate")
        }
      });
      toast.success("Hostel invoice issued!");
      setShowIssueInvoiceModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to issue invoice.");
    }
  };

  const handleQuickIssueBill = async (studentId: string, hostelId: string) => {
    const plan = feePlans.find(p => {
      const pHostelId = p.hostelId?._id || p.hostelId || "";
      return pHostelId.toString() === hostelId.toString();
    }) || feePlans[0];

    if (!plan) {
      toast.error("Please create a Hostel Fee Plan first.");
      return;
    }

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days from now
      await apiClient("/hostel/fees/invoices", {
        method: "POST",
        data: {
          studentId,
          feePlanId: plan._id || plan.id,
          dueDate: dueDate.toISOString().split("T")[0]
        }
      });
      toast.success(`Invoice issued successfully using plan: ${plan.name}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to issue invoice.");
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/fees/payments", {
        method: "POST",
        data: {
          invoiceId: selectedInvoice?._id || selectedInvoice?.id,
          amount: Number(fd.get("amount")),
          paymentMethod: fd.get("paymentMethod"),
          transactionId: fd.get("transactionId")
        }
      });
      toast.success("Payment recorded!");
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      toast.error("Payment registration failed.");
    }
  };

  // Post Notice
  const handlePostNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/notices", {
        method: "POST",
        data: {
          title: fd.get("title"),
          content: fd.get("content"),
          target: fd.get("target")
        }
      });
      toast.success("Notice posted!");
      setShowNoticeModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to post notice.");
    }
  };

  // Post Warden Alert Broadcast
  const handleBroadcastMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/messages", {
        method: "POST",
        data: {
          hostelId: fd.get("hostelId"),
          targetAudience: fd.get("targetAudience"),
          type: fd.get("type"),
          title: fd.get("title"),
          content: fd.get("content")
        }
      });
      toast.success("Warden broadcast message dispatched!");
      setShowWardenMsgModal(false);
      fetchData();
    } catch (err) {
      toast.error("Warden alert broadcast failed.");
    }
  };

  // Allocate Bed Form Submit
  const handleAllocateBed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/allocations", {
        method: "POST",
        data: {
          studentId: fd.get("studentId"),
          hostelId: fd.get("hostelId"),
          floorId: fd.get("floorId"),
          roomId: fd.get("roomId"),
          bedId: fd.get("bedId")
        }
      });
      toast.success("Accommodation assigned to student successfully.");
      setShowAllotmentModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to allocate bed.");
    }
  };

  // Vacate Bed Allocation
  const handleVacateBed = async (studentId: string) => {
    if (!confirm("Are you sure you want to vacate this bed allocation?")) return;
    try {
      await apiClient("/hostel/allocations/vacate", {
        method: "POST",
        data: { studentId }
      });
      toast.success("Bed vacated successfully.");
      fetchData();
    } catch (err) {
      toast.error("Failed to vacate bed.");
    }
  };

  // Movement Log Check-out
  const handleCheckOutStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiClient("/hostel/movement", {
        method: "POST",
        data: {
          studentId: fd.get("studentId"),
          studentName: fd.get("studentName"),
          outTime: new Date().toISOString(),
          expectedInTime: fd.get("expectedInTime"),
          reason: fd.get("reason"),
          status: "Outside"
        }
      });
      toast.success("Student check-out gatepass recorded.");
      setShowMovementModal(false);
      fetchData();
    } catch (err) {
      toast.error("Gatepass check-out recording failed.");
    }
  };

  // Roll Call Attendance Save
  const handleSaveAttendance = async () => {
    const presentIds = Object.keys(presentBeds).filter(k => presentBeds[k]);
    const absentIds = Object.keys(presentBeds).filter(k => !presentBeds[k]);

    try {
      await apiClient("/hostel/attendance", {
        method: "POST",
        data: {
          date: attendanceDate,
          session: attendanceSession,
          presentIds,
          absentIds
        }
      });
      toast.success("Hostel attendance roll call saved successfully!");
      fetchData();
    } catch (err) {
      toast.error("Attendance submission failed.");
    }
  };

  // Gather allClasses and allDivisions for dropdown selection
  const allClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.classDetails?.name || s.classId?.name || (s.classId && typeof s.classId === 'object' ? (s.classId as any).name : s.classId) || "N/A"))).filter(Boolean);
  }, [students]);

  const allDivisions = useMemo(() => {
    return Array.from(new Set(students.map(s => s.sectionDetails?.name || s.sectionId?.name || (s.sectionId && typeof s.sectionId === 'object' ? (s.sectionId as any).name : s.sectionId) || "N/A"))).filter(Boolean);
  }, [students]);

  const selectedHostelObj = useMemo(() => {
    return hostels.find(h => (h._id || h.id) === selectedAllotmentHostelId);
  }, [hostels, selectedAllotmentHostelId]);

  const isBoysHostel = selectedHostelObj?.hostelType === "Boys";
  const isGirlsHostel = selectedHostelObj?.hostelType === "Girls";

  // Filter students based on hostel gender type and class/div selections
  const filteredStudentsForAllotment = useMemo(() => {
    return students.filter(s => {
      // Gender rule validation
      if (isBoysHostel && s.gender?.toUpperCase() !== "MALE") return false;
      if (isGirlsHostel && s.gender?.toUpperCase() !== "FEMALE") return false;

      // Class filter
      if (selectedAllotmentClass) {
        const clsName = s.classDetails?.name || s.classId?.name || s.classId;
        if (clsName !== selectedAllotmentClass) return false;
      }

      // Division filter
      if (selectedAllotmentDiv) {
        const divName = s.sectionDetails?.name || s.sectionId?.name || s.sectionId;
        if (divName !== selectedAllotmentDiv) return false;
      }

      return true;
    });
  }, [students, isBoysHostel, isGirlsHostel, selectedAllotmentClass, selectedAllotmentDiv]);

  // Filter floors, rooms, and beds dynamically
  const filteredFloors = useMemo(() => {
    if (!selectedAllotmentHostelId) return [];
    return floors.filter(f => {
      const floorHostelId = f.hostelId && typeof f.hostelId === 'object'
        ? (f.hostelId._id || f.hostelId.id)
        : f.hostelId;
      return String(floorHostelId || "") === String(selectedAllotmentHostelId);
    });
  }, [floors, selectedAllotmentHostelId]);

  const filteredRooms = useMemo(() => {
    if (!selectedAllotmentFloorId) return [];
    return rooms.filter(r => {
      const roomFloorId = r.floorId && typeof r.floorId === 'object'
        ? (r.floorId._id || r.floorId.id)
        : r.floorId;
      return String(roomFloorId || "") === String(selectedAllotmentFloorId);
    });
  }, [rooms, selectedAllotmentFloorId]);

  const filteredBeds = useMemo(() => {
    if (!selectedAllotmentRoomId) return [];
    return beds.filter(b => {
      const bedRoomId = b.roomId && typeof b.roomId === 'object'
        ? (b.roomId._id || b.roomId.id)
        : b.roomId;
      return String(bedRoomId || "") === String(selectedAllotmentRoomId);
    });
  }, [beds, selectedAllotmentRoomId]);

  // Filter items
  const filteredBedsList = useMemo(() => {
    return beds.filter(b => {
      if (roomFilter && b.roomId?.roomNumber !== roomFilter) return false;
      return true;
    });
  }, [beds, roomFilter]);

  const filteredInvoices = useMemo(() => {
    return feeInvoices.filter(inv => {
      // 1. Hostel filter
      if (feeFilterHostelId) {
        const hostelId = inv.feePlanId?.hostelId?._id || inv.feePlanId?.hostelId || "";
        if (hostelId.toString() !== feeFilterHostelId) return false;
      }
      // 2. Status filter
      if (feeFilterStatus) {
        if (inv.status !== feeFilterStatus) return false;
      }
      // 3. Student search filter
      if (feeFilterStudentSearch) {
        const firstName = inv.studentId?.userId?.firstName || '';
        const lastName = inv.studentId?.userId?.lastName || '';
        const name = `${firstName} ${lastName}`.toLowerCase();
        const adm = (inv.studentId?.admissionNumber || '').toLowerCase();
        const term = feeFilterStudentSearch.toLowerCase();
        if (!name.includes(term) && !adm.includes(term)) return false;
      }
      return true;
    });
  }, [feeInvoices, feeFilterHostelId, feeFilterStatus, feeFilterStudentSearch]);

  const blockAllocatedStudents = useMemo(() => {
    if (!feeFilterHostelId) return [];
    return allocations.filter(a => {
      const hostelId = a.hostelId?._id || a.hostelId || "";
      return hostelId.toString() === feeFilterHostelId && a.status === "Active";
    });
  }, [allocations, feeFilterHostelId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Management Module"
        subtitle="Manage structural layout configurator, bed allotments, fee invoicing, roll call attendance register, gatepass logs, and warden notices."
        actions={
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowHostelModal(true)}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Hostel
            </button>
          </div>
        }
      />

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Hostels" value={String(analytics.totalHostels || hostels.length)} icon={Building2} tone="info" />
        <StatCard 
          label="Beds Occupancy" 
          value={`${analytics.occupiedBeds || 0} / ${analytics.totalBeds || 0}`} 
          delta={`${analytics.occupancyPct || 0}% Occupied`} 
          icon={Users} 
          tone="success" 
        />
        <StatCard label="Open Complaints" value={String(analytics.openComplaints || complaints.length)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Pending Fees" value={`₹${(analytics.pendingFees || 0).toLocaleString()}`} icon={DollarSign} tone="critical" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["dashboard", "Overview"],
            ["hostels", "Hostels List"],
            ["structure", "Structure Configurator"],
            ["allotments", "Bed Allotments"],
            ["fees", "Hostel Billing"],
            ["attendance", "Attendance Roll Call"],
            ["movement", "Movement Register"],
            ["visitors", "Visitor Log"],
            ["complaints", "Complaints Log"],
            ["reports", "Reports Center"]
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

      {/* 1. Dashboard Tab */}
      {tab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Hostel Occupancy & Health Overview">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="font-semibold text-sm">Hostel Block</span>
                  <span className="font-semibold text-sm">Beds Allocation Status</span>
                </div>
                {hostels.map(h => {
                  const hostelId = h._id || h.id;
                  const total = beds.filter(b => {
                    const bedHostelId = b.hostelId && typeof b.hostelId === 'object' ? (b.hostelId._id || b.hostelId.id) : b.hostelId;
                    return String(bedHostelId || "") === String(hostelId);
                  }).length;
                  const occupied = beds.filter(b => {
                    const bedHostelId = b.hostelId && typeof b.hostelId === 'object' ? (b.hostelId._id || b.hostelId.id) : b.hostelId;
                    return String(bedHostelId || "") === String(hostelId) && b.status === "Occupied";
                  }).length;
                  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                  return (
                    <div key={hostelId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{h.hostelName} ({h.hostelType})</span>
                        <span className="text-muted-foreground">{occupied} / {total} Beds ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${h.hostelType === 'Boys' ? 'bg-blue-500' : 'bg-pink-500'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
                {hostels.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6">No hostels registered yet.</div>
                )}
              </div>
            </Panel>
            
            <Panel title="Warden Notice Board & Announcements">
              <div className="space-y-4">
                {notices.slice(0, 3).map(n => (
                  <div key={n._id || n.id} className="border-l-4 border-accent p-3 bg-accent/5 rounded-r-lg">
                    <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{new Date(n.createdAt).toLocaleDateString()} · warden</p>
                    <p className="text-sm text-muted-foreground">{n.content}</p>
                  </div>
                ))}
                {notices.length === 0 && (
                  <EmptyState icon={AlertCircle} title="Notice Board is empty" description="Announcements from wardens will appear here." />
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Today's Gatepass Movement Overview">
              <div className="space-y-3">
                {leaves.filter(l => l.status === "approved" && !l.actualInTime).map(l => (
                  <div key={l._id || l.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="font-semibold text-sm">{l.studentName}</div>
                      <div className="text-xs text-muted-foreground">Reason: {l.reason}</div>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                      Out Since {new Date(l.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {leaves.filter(l => l.status === "approved" && !l.actualInTime).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-12">No students currently checked out.</div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* 2. Hostels List Tab */}
      {tab === "hostels" && (
        <Panel title="Active Hostel Buildings & Blocks">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">Hostel Block / Building</th>
                  <th className="pb-3 px-4">Gender Type</th>
                  <th className="pb-3 px-4">Warden Name</th>
                  <th className="pb-3 px-4">Warden Contact</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hostels.map(h => {
                  const id = h._id || h.id;
                  return (
                    <tr key={id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-foreground">{h.buildingName}</td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${h.hostelType === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {h.hostelType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{h.wardenName || 'Not Assigned'}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{h.wardenContact || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right space-x-2">
                        <button
                          onClick={async () => {
                            const newStatus = h.status === 'Active' ? 'Inactive' : 'Active';
                            await apiClient(`/hostel/${id}`, { method: "PATCH", data: { status: newStatus } });
                            toast.success(`Hostel status toggled to ${newStatus}`);
                            fetchData();
                          }}
                          className="text-xs bg-muted px-2.5 py-1 rounded-md font-semibold text-foreground hover:bg-border"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this hostel? All floors, rooms, and beds will be removed.")) return;
                            await apiClient(`/hostel/${id}`, { method: "DELETE" });
                            toast.success("Hostel deleted.");
                            fetchData();
                          }}
                          className="text-muted-foreground hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hostels.length === 0 && (
              <EmptyState icon={Building2} title="No hostels configured" description="Click Add Hostel to begin structural setup." />
            )}
          </div>
        </Panel>
      )}

      {/* 3. Structure Configurator */}
      {tab === "structure" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Panel title="Dynamic Structure Builder">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold uppercase text-muted-foreground">Select Hostel Block</label>
                  <select
                    value={activeHostelId}
                    onChange={(e) => setActiveHostelId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- Select Block --</option>
                    {hostels.map(h => (
                      <option key={h._id || h.id} value={h._id || h.id}>{h.hostelName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold uppercase text-muted-foreground">Number of Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={numFloors}
                    onChange={(e) => handleFloorsCountChange(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto border border-border p-3 rounded-lg bg-muted/20">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground">Rooms & Beds Configuration</h4>
                  {Array.from({ length: numFloors }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2 pb-2 border-b border-border/40 last:border-0">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Floor {idx + 1} Rooms</label>
                        <input
                          type="number"
                          min={1}
                          value={floorConfig[idx]?.roomsCount || 5}
                          onChange={(e) => handleFloorRoomChange(idx, "roomsCount", Number(e.target.value))}
                          className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Beds Per Room</label>
                        <input
                          type="number"
                          min={1}
                          value={floorConfig[idx]?.bedsPerRoom || 4}
                          onChange={(e) => handleFloorRoomChange(idx, "bedsPerRoom", Number(e.target.value))}
                          className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerateStructure}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  Generate Hostel Layout
                </button>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-2">
            <Panel title="Hostel Structure Tree View">
              {rooms.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-12">
                  No rooms or layouts configured. Select a hostel block and generate structure to view layout.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select filters */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Filter Room No. (e.g. 101)"
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary w-48"
                    />
                    {roomFilter && (
                      <button onClick={() => setRoomFilter("")} className="text-xs text-red-500 font-semibold hover:underline">
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto border border-border p-4 rounded-xl bg-card">
                    {/* Render Rooms grouped by Floor */}
                    {Array.from(new Set(rooms.map(r => (r.floorId?._id || r.floorId || "").toString()))).filter(Boolean).map(flId => {
                      const floorRooms = rooms.filter(r => (r.floorId?._id || r.floorId || "").toString() === flId && (!roomFilter || r.roomNumber === roomFilter));
                      if (floorRooms.length === 0) return null;
                      const floorNum = floorRooms[0].floorId?.floorNumber || "1";
                      return (
                        <div key={flId} className="space-y-2 pb-4 border-b border-border/40 last:border-0">
                          <h4 className="font-bold text-sm text-foreground">Floor {floorNum}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {floorRooms.map(r => {
                              const roomId = r._id || r.id;
                              let roomBeds = beds.filter(b => b.roomId === roomId || b.roomId?._id === roomId);
                              const total = r.capacity || roomBeds.length || 0;
                              
                              // Fallback to mock beds if database beds are not created yet
                              if (roomBeds.length === 0 && total > 0) {
                                roomBeds = Array.from({ length: total }).map((_, idx) => ({
                                  _id: `mock-bed-${roomId}-${idx}`,
                                  bedNumber: idx + 1,
                                  status: "Available"
                                }));
                              }

                              const occupied = roomBeds.filter(b => b.status === "Occupied").length;
                              
                              let status: "available" | "full" | "maintenance" = "available";
                              if (r.status === "maintenance" || r.status === "Maintenance") {
                                status = "maintenance";
                              } else if (occupied === total && total > 0) {
                                status = "full";
                              }

                              const cardStyles = {
                                available: "border-slate-200 bg-white shadow-sm",
                                full: "border-[#d3e2fd] bg-[#f0f4f9] shadow-sm",
                                maintenance: "border-[#f8e5c2] bg-[#fdf8f0] shadow-sm"
                              }[status];

                              const badgeStyles = {
                                available: "text-[#1b8042] bg-[#e6f4ea]",
                                full: "text-[#1a73e8] bg-[#e8f0fe]",
                                maintenance: "text-[#b06000] bg-[#fef7e0]"
                              }[status];

                              return (
                                <div key={roomId} className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${cardStyles}`}>
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-base text-[#1f1f1f]">
                                      {r.block || "Block"} · {r.room_no || r.roomNumber}
                                    </h4>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badgeStyles}`}>
                                      {status}
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-2 flex-wrap">
                                    {roomBeds.map(b => {
                                      const isOccupied = b.status === "Occupied";
                                      const studentId = b.assignedStudent?._id || b.assignedStudent;
                                      
                                      // Check if student is absent (marked false in roll-call OR on approved leave/gatepass)
                                      const isStudentOut = leaves.some(l => 
                                        (l.studentId?._id === studentId || l.studentId === studentId) && 
                                        l.status === 'approved' && 
                                        !l.actualInTime
                                      );
                                      const isAbsent = presentBeds[studentId] === false || isStudentOut;

                                      return (
                                        <div 
                                          key={b._id || b.id} 
                                          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                                            isOccupied 
                                              ? (isAbsent ? 'bg-[#ea4335] text-white shadow-sm' : 'bg-[#34a853] text-white shadow-sm')
                                              : 'border border-[#dadce0] bg-[#f8f9fa] text-slate-400'
                                          }`}
                                          title={`Bed ${b.bedNumber} - ${b.status} ${isOccupied ? (isAbsent ? '(Absent)' : '(Present)') : ''}`}
                                        >
                                          {isOccupied ? (
                                            <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                                          ) : (
                                            <div className="h-2.5 w-2.5 rounded-full border-2 border-[#70757a] bg-transparent" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="text-xs font-semibold text-[#5f6368]">
                                    {occupied}/{total} beds occupied
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* 4. Bed Allotments */}
      {tab === "allotments" && (
        <Panel 
          title="Allotments & Bed Allocations Log"
          action={
            <button
              onClick={() => setShowAllotmentModal(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              New Bed Allocation
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search Student Name / Admission No..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary w-72"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 px-4">Hostel</th>
                    <th className="pb-3 px-4">Room / Bed</th>
                    <th className="pb-3 px-4">Check-In Date</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations
                    .filter(a => {
                      const name = a.studentId?.userId?.firstName || '';
                      const code = a.studentId?.admissionNumber || '';
                      const term = studentSearch.toLowerCase();
                      return name.toLowerCase().includes(term) || code.toLowerCase().includes(term);
                    })
                    .map(a => {
                      const id = a._id || a.id;
                      return (
                        <tr key={id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-foreground">
                              {a.studentId?.userId?.firstName || '—'} {a.studentId?.userId?.lastName || ''}
                            </div>
                            <div className="text-xs text-muted-foreground">Adm: {a.studentId?.admissionNumber || '—'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-muted-foreground">
                            {a.hostelId?.hostelName || '—'} ({a.hostelId?.hostelType || '—'})
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold">Room {a.roomId?.roomNumber || '—'}</div>
                            <div className="text-xs text-muted-foreground">Bed #{a.bedId?.bedNumber || '—'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {new Date(a.checkInDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            {a.status === 'Active' && (
                              <button
                                onClick={() => handleVacateBed(a.studentId?._id || a.studentId)}
                                className="rounded bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20"
                              >
                                Vacate Bed
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {allocations.length === 0 && (
                <EmptyState icon={UserCheck} title="No allocations registered" description="Allocate students to rooms to display list." />
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* 5. Hostel Billing / Fees */}
      {tab === "fees" && (
        <div className="space-y-6">
          {/* Billing filter panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border p-4 rounded-xl bg-card">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Search Student</label>
              <input
                type="text"
                placeholder="Search Student Name / Adm No..."
                value={feeFilterStudentSearch}
                onChange={e => setFeeFilterStudentSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Filter by Building Block</label>
              <select
                value={feeFilterHostelId}
                onChange={e => setFeeFilterHostelId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">-- All Buildings / Blocks --</option>
                {hostels.map(h => (
                  <option key={h._id || h.id} value={h._id || h.id}>{h.buildingName} ({h.hostelType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Payment Status</label>
              <select
                value={feeFilterStatus}
                onChange={e => setFeeFilterStatus(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">-- All Invoices (Paid & Unpaid) --</option>
                <option value="PAID">Paid Invoices</option>
                <option value="PENDING">Unpaid / Pending Invoices</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel 
              title="Hostel Fee Plans"
              action={
                <button onClick={() => setShowFeePlanModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-bold">
                  <Plus className="h-3.5 w-3.5" />
                  New Plan
                </button>
              }
            >
              <div className="space-y-3">
                {feePlans.map(p => (
                  <div key={p._id || p.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card">
                    <div>
                      <div className="font-bold text-sm text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Cycle: {p.billingCycle} · Hostel: {p.hostelId?.hostelName}</div>
                    </div>
                    <div className="font-bold text-foreground">₹{p.amount}</div>
                  </div>
                ))}
                {feePlans.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">No billing plans created.</div>
                )}
              </div>
            </Panel>

            <Panel 
              title="Billing Invoices Log"
              action={
                <button onClick={() => setShowIssueInvoiceModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-bold">
                  <Plus className="h-3.5 w-3.5" />
                  Issue Invoice
                </button>
              }
            >
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredInvoices.map(inv => (
                  <div key={inv._id || inv.id} className="p-3 border border-border rounded-lg bg-card flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">
                        {inv.studentId?.userId?.firstName || 'Student'} {inv.studentId?.userId?.lastName || ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Plan: {inv.feePlanId?.name} · Block: {inv.feePlanId?.hostelId?.buildingName || inv.feePlanId?.hostelId?.hostelName || '—'} · Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-foreground">₹{inv.amount}</div>
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowPaymentModal(true);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                        disabled={inv.status === 'PAID'}
                      >
                        {inv.status}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredInvoices.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">No matching invoice bills found.</div>
                )}
              </div>
            </Panel>
          </div>

          {/* Roster list by Building Block if hostel block is selected */}
          {feeFilterHostelId && (
            <Panel title="Building Block Billing Roster (Quick Status Editor)">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 px-4">Room / Bed</th>
                      <th className="pb-3 px-4">Billing Plan</th>
                      <th className="pb-3 px-4">Bill Amount</th>
                      <th className="pb-3 pl-4 text-right">Payment Status (Edit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {blockAllocatedStudents.map(a => {
                      const studentIdStr = (a.studentId?._id || a.studentId || "").toString();
                      const studentName = `${a.studentId?.userId?.firstName || 'Student'} ${a.studentId?.userId?.lastName || ''}`;
                      const studentAdm = a.studentId?.admissionNumber || '—';
                      
                      // Find student's latest invoice
                      const latestInvoice = feeInvoices.find(inv => {
                        const invStudentId = inv.studentId?._id || inv.studentId || "";
                        return invStudentId.toString() === studentIdStr;
                      });

                      return (
                        <tr key={a._id || a.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-foreground">{studentName}</div>
                            <div className="text-xs text-muted-foreground">Adm: {studentAdm}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-muted-foreground">
                            Room {a.roomId?.roomNumber || '—'} / Bed #{a.bedId?.bedNumber || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {latestInvoice ? latestInvoice.feePlanId?.name : 'No Active Plan'}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {latestInvoice ? `₹${latestInvoice.amount}` : '—'}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            {latestInvoice ? (
                              <select
                                value={latestInvoice.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  try {
                                    await apiClient(`/hostel/fees/invoices/${latestInvoice._id}/status`, {
                                      method: "PATCH",
                                      data: { status: newStatus }
                                    });
                                    toast.success(`Bill marked as ${newStatus}`);
                                    fetchData();
                                  } catch (err) {
                                    toast.error("Failed to update payment status.");
                                  }
                                }}
                                className={`h-8 rounded-lg border px-3 text-xs font-bold transition-all outline-none ${
                                  latestInvoice.status === 'PAID'
                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800 focus:border-emerald-500'
                                    : 'border-amber-300 bg-amber-100 text-amber-800 focus:border-amber-500'
                                }`}
                              >
                                <option value="PENDING">Unpaid</option>
                                <option value="PAID">Paid</option>
                              </select>
                            ) : (
                              <button
                                onClick={() => handleQuickIssueBill(a.studentId?._id || a.studentId, a.hostelId?._id || a.hostelId)}
                                className="rounded bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                              >
                                Issue Bill
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {blockAllocatedStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                          No students currently allocated to this building block.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* 6. Attendance Roll Call */}
      {tab === "attendance" && (
        <Panel title="Roll-Call Attendance Sheet">
          <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap pb-3 border-b border-border/40">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Session Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Attendance Session</label>
                <select
                  value={attendanceSession}
                  onChange={(e) => setAttendanceSession(e.target.value as any)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm w-44"
                >
                  <option value="morning">Morning Check</option>
                  <option value="evening">Evening Check</option>
                  <option value="night">Night Check</option>
                </select>
              </div>
              <button
                onClick={handleSaveAttendance}
                className="self-end h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all ml-auto"
              >
                Submit Attendance Records
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                    <th className="pb-3 pr-4">Bed Number</th>
                    <th className="pb-3 px-4">Room No</th>
                    <th className="pb-3 px-4">Assigned Student</th>
                    <th className="pb-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {beds.filter(b => b.status === "Occupied").map(b => {
                    const studentId = b.assignedStudent?._id || b.assignedStudent;
                    const isPresent = presentBeds[studentId] ?? true;
                    return (
                      <tr key={b._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">Bed #{b.bedNumber}</td>
                        <td className="py-3 px-4 font-medium text-muted-foreground">Room {b.roomId?.roomNumber || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {b.assignedStudent?.userId?.firstName || 'Assigned Student'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setPresentBeds(prev => ({ ...prev, [studentId]: !isPresent }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPresent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                          >
                            {isPresent ? 'Present' : 'Absent'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {beds.filter(b => b.status === "Occupied").length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                        No students are currently allocated to any bed blocks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* 7. Movement Tab */}
      {tab === "movement" && (
        <Panel 
          title="Gatepass Movement Register"
          action={
            <button onClick={() => setShowMovementModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-bold">
              <Plus className="h-3.5 w-3.5" />
              Check Out Student
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 px-4">Time Out</th>
                  <th className="pb-3 px-4">Expected In</th>
                  <th className="pb-3 px-4">Actual Arrival</th>
                  <th className="pb-3 px-4">Reason</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves.map(l => (
                  <tr key={l._id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-foreground">{l.studentName}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{new Date(l.outTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{new Date(l.expectedInTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {l.actualInTime ? new Date(l.actualInTime).toLocaleString() : 'Outside'}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{l.reason}</td>
                    <td className="py-3.5 pl-4 text-right">
                      {l.status === 'pending' && (
                        <button
                          onClick={async () => {
                            await apiClient(`/hostel/leaves/${l._id}/status`, {
                              method: "PATCH",
                              data: { status: "approved" }
                            });
                            toast.success("Leave approved");
                            fetchData();
                          }}
                          className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20"
                        >
                          Approve
                        </button>
                      )}
                      {l.status === 'approved' && !l.actualInTime && (
                        <button
                          onClick={async () => {
                            await apiClient(`/hostel/leaves/${l._id}/status`, {
                              method: "PATCH",
                              data: { status: "completed", actualInTime: new Date().toISOString() }
                            });
                            toast.success("Student marked as returned.");
                            fetchData();
                          }}
                          className="rounded bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/20"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && (
              <EmptyState icon={LogOut} title="Gatepass register is empty" description="Check out student logs will display here." />
            )}
          </div>
        </Panel>
      )}

      {/* 8. Visitors Log */}
      {tab === "visitors" && (
        <Panel 
          title="Visitor Register"
          action={
            <button onClick={() => setShowVisitorModal(true)} className="flex items-center gap-1 text-xs text-accent hover:underline font-bold">
              <Plus className="h-3.5 w-3.5" />
              Log Visitor
            </button>
          }
        >
          <div className="space-y-3">
            {visitors.map(v => (
              <div key={v._id} className="flex items-center justify-between p-3.5 border border-border bg-card rounded-lg">
                <div>
                  <div className="font-bold text-sm">{v.visitorName}</div>
                  <div className="text-xs text-muted-foreground">Visiting: {v.studentName} · Purpose: {v.purpose}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">In: {new Date(v.checkIn).toLocaleString()}</div>
                </div>
                <div>
                  {v.status === 'checked-in' ? (
                    <button
                      onClick={async () => {
                        await apiClient(`/hostel/visitors/${v._id}`, {
                          method: "PATCH",
                          data: { status: "checked-out", checkOut: new Date().toISOString() }
                        });
                        toast.success("Visitor checked out");
                        fetchData();
                      }}
                      className="rounded bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
                    >
                      Check Out
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize">{v.status}</span>
                  )}
                </div>
              </div>
            ))}
            {visitors.length === 0 && (
              <EmptyState icon={Users} title="No visitor entries logged today" description="Create entries to track campus visitors." />
            )}
          </div>
        </Panel>
      )}

      {/* 9. Complaints Register */}
      {tab === "complaints" && (
        <Panel title="Hostel Complaints Register">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 px-4">Room No</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Description</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map(c => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-foreground">{c.student_name}</td>
                      <td className="py-3.5 px-4 font-medium">{c.room || '—'}</td>
                      <td className="py-3.5 px-4 capitalize text-muted-foreground">{c.category}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate">{c.description}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          c.status === 'resolved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : c.status === 'in-progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : c.status === 'emergency'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status === 'resolved' ? 'Completed' : c.status === 'in-progress' ? 'In Process' : c.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <select
                          value={c.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              await apiClient(`/hostel/complaints/${id}`, {
                                method: "PATCH",
                                data: { status: newStatus }
                              });
                              toast.success("Complaint status updated successfully!");
                              fetchData();
                            } catch (err) {
                              toast.error("Failed to update status.");
                            }
                          }}
                          className={`h-8 rounded-lg border px-3 text-xs font-bold outline-none ${
                            c.status === 'resolved'
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800 focus:border-emerald-500'
                              : c.status === 'in-progress'
                              ? 'border-blue-300 bg-blue-100 text-blue-800 focus:border-blue-500'
                              : 'border-amber-300 bg-amber-100 text-amber-800 focus:border-amber-500'
                          }`}
                        >
                          <option value="open">New / Open</option>
                          <option value="in-progress">In Process</option>
                          <option value="resolved">Completed</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                      No complaints registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}


      {/* 10. Reports Center */}
      {tab === "reports" && (
        <Panel 
          title="Hostel Reports Hub"
          action={
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs border border-border bg-background px-3 py-1.5 rounded-lg font-semibold hover:bg-muted">
                <Printer className="h-3.5 w-3.5" />
                Print Report
              </button>
              <button onClick={() => toast.success("Excel report exported!")} className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-border p-4 rounded-xl bg-card hover:shadow-md transition-all">
                <h4 className="font-bold text-sm text-foreground mb-1">Hostel Occupancy Report</h4>
                <p className="text-xs text-muted-foreground">List of all hostels with their active structures, capacity, and vacancy percentages.</p>
              </div>
              <div className="border border-border p-4 rounded-xl bg-card hover:shadow-md transition-all">
                <h4 className="font-bold text-sm text-foreground mb-1">Fee Defaulters list</h4>
                <p className="text-xs text-muted-foreground">Generate comprehensive lists of unpaid quarterly, monthly, and yearly invoices.</p>
              </div>
              <div className="border border-border p-4 rounded-xl bg-card hover:shadow-md transition-all">
                <h4 className="font-bold text-sm text-foreground mb-1">In/Out Student Logs</h4>
                <p className="text-xs text-muted-foreground">Movement history and gatepass verification dates for warden audits.</p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* ----------------- MODALS ----------------- */}
      
      {/* Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowHostelModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Add Hostel Building</h2>
              <button onClick={() => setShowHostelModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Building / Block Name</label>
                <input name="buildingName" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Hostel Type</label>
                <select name="hostelType" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Warden Name</label>
                <input name="wardenName" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Warden Contact Number</label>
                <input name="wardenContact" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <textarea name="description" rows={3} className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Create Hostel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bed Allotment Modal */}
      {showAllotmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAllotmentModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">New Accommodation Allotment</h2>
              <button onClick={() => setShowAllotmentModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAllocateBed} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Select Hostel Block</label>
                <select 
                  name="hostelId" 
                  required 
                  value={selectedAllotmentHostelId}
                  onChange={e => {
                    setSelectedAllotmentHostelId(e.target.value);
                    setSelectedAllotmentFloorId("");
                    setSelectedAllotmentRoomId("");
                  }}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">-- Choose Hostel --</option>
                  {hostels.map(h => (
                    <option key={h._id || h.id} value={h._id || h.id}>{h.buildingName} ({h.hostelType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Select Class</label>
                  <select 
                    value={selectedAllotmentClass} 
                    onChange={e => setSelectedAllotmentClass(e.target.value)} 
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- All Classes --</option>
                    {allClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Select Division</label>
                  <select 
                    value={selectedAllotmentDiv} 
                    onChange={e => setSelectedAllotmentDiv(e.target.value)} 
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- All Divisions --</option>
                    {allDivisions.map(divName => (
                      <option key={divName} value={divName}>{divName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Select Student</label>
                <select name="studentId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">-- Choose Student --</option>
                  {filteredStudentsForAllotment.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.user?.firstName || s.userId?.firstName || 'Student'} {s.user?.lastName || s.userId?.lastName || ''} (Adm: {s.admissionNumber || '—'} - {s.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Floor</label>
                  <select 
                    name="floorId" 
                    required 
                    value={selectedAllotmentFloorId}
                    onChange={e => {
                      setSelectedAllotmentFloorId(e.target.value);
                      setSelectedAllotmentRoomId("");
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- Floor --</option>
                    {filteredFloors.map(f => (
                      <option key={f._id} value={f._id}>Floor {f.floorNumber}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">Room</label>
                  <select 
                    name="roomId" 
                    required 
                    value={selectedAllotmentRoomId}
                    onChange={e => setSelectedAllotmentRoomId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- Room --</option>
                    {filteredRooms.map(r => (
                      <option key={r._id} value={r._id}>Room {r.roomNumber || r.room_no}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">Bed Slot</label>
                  <select 
                    name="bedId" 
                    required 
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">-- Bed --</option>
                    {filteredBeds.map(b => {
                      const isOccupied = b.status === "Occupied";
                      return (
                        <option 
                          key={b._id} 
                          value={b._id} 
                          disabled={isOccupied}
                        >
                          Bed #{b.bedNumber} {isOccupied ? "(Occupied)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 mt-2">
                Allocate Accommodation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fee Plan Modal */}
      {showFeePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFeePlanModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Create Hostel Fee Plan</h2>
              <button onClick={() => setShowFeePlanModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateFeePlan} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Plan Name</label>
                <input name="name" required placeholder="e.g. Standard Yearly Fee" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Associated Hostel Block</label>
                <select name="hostelId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">-- Choose Hostel --</option>
                  {hostels.map(h => (
                    <option key={h._id || h.id} value={h._id || h.id}>{h.hostelName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Billing Term</label>
                <select name="billingCycle" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Amount (₹)</label>
                <input name="amount" type="number" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Late Fee Penalty (₹)</label>
                <input name="lateFee" type="number" defaultValue="0" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Save Fee Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Issue Invoice Modal */}
      {showIssueInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowIssueInvoiceModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Issue Hostel Fee Bill</h2>
              <button onClick={() => setShowIssueInvoiceModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleIssueInvoice} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Select Student</label>
                <select name="studentId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.userId?.firstName || 'Student'} {s.userId?.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Select Fee Plan</label>
                <select name="feePlanId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">-- Choose Plan --</option>
                  {feePlans.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name} (₹{p.amount})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Due Date</label>
                <input name="dueDate" type="date" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Issue Hostel Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Record Transaction Payment</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Paying Amount (₹)</label>
                <input 
                  name="amount" 
                  type="number" 
                  max={selectedInvoice ? selectedInvoice.amount - selectedInvoice.paidAmount : undefined}
                  defaultValue={selectedInvoice ? String(selectedInvoice.amount - selectedInvoice.paidAmount) : "0"} 
                  required 
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" 
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Payment Mode</label>
                <select name="paymentMethod" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="Cash">Cash Handover</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank">Direct Net Banking</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Reference Transaction ID</label>
                <input name="transactionId" placeholder="Ref No. or Txn ID" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                Confirm Invoice Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNoticeModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Post Notice Announcement</h2>
              <button onClick={() => setShowNoticeModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Notice Title</label>
                <input name="title" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Description</label>
                <textarea name="content" rows={4} required className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Audience target</label>
                <select name="target" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="ALL">All Blocks</option>
                  <option value="BLOCK">Warden Assigned Block Only</option>
                </select>
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Post Notice Board Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Message Modal */}
      {showWardenMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWardenMsgModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Warden Communication Broadcast</h2>
              <button onClick={() => setShowWardenMsgModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleBroadcastMessage} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Select Target Hostel</label>
                <select name="hostelId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">-- Choose Hostel Block --</option>
                  {hostels.map(h => (
                    <option key={h._id || h.id} value={h._id || h.id}>{h.hostelName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Target Audience</label>
                <select name="targetAudience" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="ALL">All Parents & Students</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="PARENTS">Parents Only</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Message Urgency Type</label>
                <select name="type" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="General">General Info</option>
                  <option value="Information">Notice Update</option>
                  <option value="Warning">Warning Alert</option>
                  <option value="Emergency">Emergency Broadcast</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Message Title</label>
                <input name="title" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Message Content</label>
                <textarea name="content" rows={4} required className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Dispatch Broadcast Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMovementModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold">Log Check-Out Gatepass</h2>
              <button onClick={() => setShowMovementModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCheckOutStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Select Student</label>
                <select name="studentId" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" onChange={(e) => {
                  const s = students.find(x => x._id === e.target.value || x.id === e.target.value);
                  const name = s ? `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.trim() : '';
                  const el = document.getElementById("studentNameHidden") as HTMLInputElement;
                  if (el) el.value = name;
                }}>
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.userId?.firstName || 'Student'} {s.userId?.lastName || ''}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="studentName" id="studentNameHidden" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Expected Arrival In-Time</label>
                <input name="expectedInTime" type="datetime-local" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Check-Out Reason</label>
                <input name="reason" placeholder="e.g., Weekend Home Visit" required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Log Student Gatepass
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
