import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Utensils,
  Calendar,
  AlertTriangle,
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  FileText,
  DollarSign,
  ShieldAlert,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  TrendingUp,
  Loader2,
  ChevronRight,
  Clock,
  Settings,
  Download,
  Info,
  Edit2
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/canteen")({
  head: () => ({ meta: [{ title: "Canteen & Mess OS · Campus OS" }] }),
  component: CanteenMessPage,
});

interface MealMenu {
  _id?: string;
  id?: string;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

interface AllergyRecord {
  _id?: string;
  id?: string;
  studentId?: string;
  studentName: string;
  grade: string;
  allergens: string[];
  severity: "High" | "Medium" | "Low";
  status: "Active" | "Monitored";
  foodPreference?: "Vegetarian" | "Vegan" | "Jain" | "Non-Vegetarian";
  allergies?: string[];
}

interface RFIDTransaction {
  _id?: string;
  id?: string;
  studentName: string;
  grade: string;
  rfidTag: string;
  amount: number;
  item: string;
  type: "Debit" | "Credit";
  timestamp: string;
}

interface RFIDWallet {
  _id?: string;
  id?: string;
  studentId?: string;
  studentName: string;
  grade: string;
  rfidTag: string;
  balance: number;
  status: "Active" | "Frozen";
}

interface StudentItem {
  _id: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  rollNumber?: string;
  admissionNumber?: string;
  classDetails?: {
    name: string;
  };
  sectionDetails?: {
    name: string;
  };
}

interface MenuItem {
  _id?: string;
  id?: string;
  name: string;
  category: "Breakfast" | "Lunch" | "Snacks" | "Drinks";
  description?: string;
  price: number;
  image?: string;
  availableToday: boolean;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sugar: number;
    fiber: number;
  };
  dietaryTags: string[];
  allergyTags: string[];
}

interface SalesReport {
  rangeDays: number;
  revenue: number;
  totalOrders: number;
  popularItems: Array<{ item: string; count: number; revenue: number }>;
}

function CanteenMessPage() {
  const [tab, setTab] = useState<"orders" | "menu" | "wallets" | "reports">("orders");
  const [loading, setLoading] = useState(true);

  // Dynamic States from Backend
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<MealMenu[]>([]);
  const [allergies, setAllergies] = useState<AllergyRecord[]>([]);
  const [wallets, setWallets] = useState<RFIDWallet[]>([]);
  const [transactions, setTransactions] = useState<RFIDTransaction[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [salesRange, setSalesRange] = useState<"1" | "7" | "30">("30");
  const [settings, setSettings] = useState({ strictAllergyMode: false });

  // POS Verification flow
  const [posOrderNumber, setPosOrderNumber] = useState("");
  const [posOtp, setPosOtp] = useState("");
  const [verifyingOrder, setVerifyingOrder] = useState(false);

  // Search filter for RFID
  const [rfidSearch, setRfidSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");

  // Modal controls
  const [editingMenu, setEditingMenu] = useState<MealMenu | null>(null);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  // Menu editor modal
  const [showMenuEditorModal, setShowMenuEditorModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemImageFile, setMenuItemImageFile] = useState<File | null>(null);

  // Load Registry details
  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, itemsRes, ordersRes, allergyRes, walletsRes, txRes, stdRes, settingsRes] = await Promise.all([
        apiClient<any>("/canteen/mess-menu"),
        apiClient<any>("/canteen/menu-items"),
        apiClient<any>("/canteen/orders"),
        apiClient<any>("/canteen/dietary-profiles"),
        apiClient<any>("/canteen/wallets/all"),
        apiClient<any>("/canteen/transactions/all"),
        apiClient<any>("/students?limit=100"),
        apiClient<any>("/canteen/settings").catch(() => ({ strictAllergyMode: false })),
      ]);

      setWeeklyMenu(Array.isArray(menuRes) ? menuRes : menuRes?.data || []);
      setMenuItems(Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || []);
      setAllergies(Array.isArray(allergyRes) ? allergyRes : allergyRes?.data || []);
      setWallets(Array.isArray(walletsRes) ? walletsRes : walletsRes?.data || []);
      setTransactions(Array.isArray(txRes) ? txRes : txRes?.data || []);
      setStudents(Array.isArray(stdRes) ? stdRes : stdRes?.data || []);
      setSettings(settingsRes);
    } catch (err: any) {
      toast.error("Failed to load cafeteria registries");
    } finally {
      setLoading(false);
    }
  };

  // Load Sales Analytics
  const loadSalesReport = async () => {
    try {
      const reportRes = await apiClient<any>(`/canteen/reports?range=${salesRange}`);
      setSalesReport(reportRes?.data || reportRes || null);
    } catch (err: any) {
      console.error("Failed to load sales report", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSalesReport();
  }, [salesRange]);

  // Settings: strict mode toggle
  const handleToggleStrictMode = async (checked: boolean) => {
    try {
      setSettings({ strictAllergyMode: checked });
      await apiClient("/canteen/settings", {
        method: "PUT",
        data: { strictAllergyMode: checked }
      });
      toast.success(`Strict Allergy Mode has been ${checked ? "Enabled" : "Disabled"}.`);
    } catch (e) {
      toast.error("Failed to update cafeteria safety settings");
    }
  };

  // POS verification check
  const handlePOSVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posOrderNumber && !posOtp) {
      toast.error("Please enter Order Number or OTP");
      return;
    }
    setVerifyingOrder(true);
    try {
      const response = await apiClient<any>("/canteen/orders/verify-pickup", {
        method: "POST",
        data: { orderNumber: posOrderNumber, otp: posOtp }
      });

      if (response && response.status === "COMPLETED") {
        toast.success(`Order ${response.orderNumber} picked up successfully!`);
        setPosOrderNumber("");
        setPosOtp("");
        // Reload orders list
        const updatedOrders = await apiClient<any>("/canteen/orders");
        setOrders(Array.isArray(updatedOrders) ? updatedOrders : updatedOrders?.data || []);
        loadSalesReport();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid order number or OTP verification code");
    } finally {
      setVerifyingOrder(false);
    }
  };

  // POS manual update status
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await apiClient(`/canteen/orders/${orderId}/status`, {
        method: "PATCH",
        data: { status: nextStatus }
      });
      toast.success(`Order status updated to ${nextStatus}`);
      const updatedOrders = await apiClient<any>("/canteen/orders");
      setOrders(Array.isArray(updatedOrders) ? updatedOrders : updatedOrders?.data || []);
      loadSalesReport();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Mess menu modify
  const handleUpdateMenu = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMenu) return;

    try {
      await apiClient("/canteen/mess-menu", {
        method: "PUT",
        data: editingMenu,
      });

      setWeeklyMenu((prev) =>
        prev.map((m) => (m.day === editingMenu.day ? { ...m, ...editingMenu } : m))
      );
      toast.success(`Mess menu for ${editingMenu.day} updated successfully!`);
      setEditingMenu(null);
    } catch (err: any) {
      toast.error("Failed to update mess menu: " + (err.message || err));
    }
  };

  // Add menu item management handlers
  const handleOpenAddMenuItem = () => {
    setEditingMenuItem({
      name: "",
      category: "Snacks",
      description: "",
      price: 1.50,
      availableToday: true,
      nutrition: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, sugar: 0, fiber: 0 },
      dietaryTags: [],
      allergyTags: [],
    });
    setMenuItemImageFile(null);
    setShowMenuEditorModal(true);
  };

  const handleOpenEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuItemImageFile(null);
    setShowMenuEditorModal(true);
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await apiClient(`/canteen/menu-items/${id}`, { method: "DELETE" });
      toast.success("Menu item removed");
      const itemsRes = await apiClient<any>("/canteen/menu-items");
      setMenuItems(Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || []);
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;

    try {
      const formData = new FormData();
      formData.append("name", editingMenuItem.name);
      formData.append("category", editingMenuItem.category);
      formData.append("description", editingMenuItem.description || "");
      formData.append("price", String(editingMenuItem.price));
      formData.append("availableToday", String(editingMenuItem.availableToday));
      formData.append("nutrition", JSON.stringify(editingMenuItem.nutrition));
      formData.append("dietaryTags", JSON.stringify(editingMenuItem.dietaryTags));
      formData.append("allergyTags", JSON.stringify(editingMenuItem.allergyTags));
      if (menuItemImageFile) {
        formData.append("image", menuItemImageFile);
      }

      const method = editingMenuItem._id || editingMenuItem.id ? "PUT" : "POST";
      const id = editingMenuItem._id || editingMenuItem.id;
      const endpoint = id ? `/api/v1/canteen/menu-items/${id}` : `/api/v1/canteen/menu-items`;

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        toast.success(id ? "Menu item updated" : "Menu item added successfully!");
        setShowMenuEditorModal(false);
        setEditingMenuItem(null);
        // Reload items list
        const itemsRes = await apiClient<any>("/canteen/menu-items");
        setMenuItems(Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to save menu item");
      }
    } catch (err: any) {
      toast.error("Network upload error: " + err.message);
    }
  };

  const handleAddAllergy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const studentId = fd.get("studentId") as string;
    const allergensStr = fd.get("allergens") as string;
    const severity = fd.get("severity") as "High" | "Medium" | "Low";
    const notes = fd.get("notes") as string;

    const studentObj = students.find((s) => s._id === studentId);
    if (!studentObj) {
      toast.error("Please select a student");
      return;
    }

    const studentName = studentObj.user
      ? `${studentObj.user.firstName} ${studentObj.user.lastName}`.trim()
      : "Student";
    const grade = studentObj.rollNumber || "N/A";

    const payload = {
      studentId,
      studentName,
      grade,
      allergies: allergensStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      severity,
      notes,
      status: "Active",
    };

    try {
      const res = await apiClient<any>("/canteen/dietary-profiles", {
        method: "POST",
        data: payload,
      });
      const newProfile = res?.data || res;
      setAllergies((prev) => [newProfile, ...prev]);
      toast.success(`Dietary warning listed for ${studentName}!`);
      setShowAllergyModal(false);
    } catch (err: any) {
      toast.error("Failed to register allergy profile: " + (err.message || err));
    }
  };

  const handleTopup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const walletId = fd.get("walletId") as string;
    const amount = Number(fd.get("amount"));

    const wallet = wallets.find((w) => (w._id || w.id) === walletId);
    if (!wallet || !wallet.studentId) {
      toast.error("Invalid wallet selection");
      return;
    }

    try {
      await apiClient(`/canteen/wallets/${wallet.studentId}/top-up`, {
        method: "POST",
        data: { amount, paymentMethod: "cash" },
      });

      // Reload wallets and transaction logs
      const [walletsRes, txRes] = await Promise.all([
        apiClient<any>("/canteen/wallets/all"),
        apiClient<any>("/canteen/transactions/all"),
      ]);
      setWallets(Array.isArray(walletsRes) ? walletsRes : walletsRes?.data || []);
      setTransactions(Array.isArray(txRes) ? txRes : txRes?.data || []);

      toast.success(`Deposited ₹${amount} into ${wallet.studentName}'s RFID wallet!`);
      setShowTopupModal(false);
    } catch (err: any) {
      toast.error("Failed to top-up wallet: " + (err.message || err));
    }
  };

  const handleToggleFreeze = async (walletObj: RFIDWallet) => {
    const id = walletObj._id || walletObj.id;
    if (!id) return;

    try {
      const res = await apiClient<any>(`/canteen/wallets/${id}/freeze`, {
        method: "PUT",
      });
      const updated = res?.data || res;
      setWallets((prev) => prev.map((w) => ((w._id || w.id) === id ? { ...w, status: updated.status } : w)));
      toast.info(`RFID Tag status changed: ${walletObj.studentName}'s tag is now ${updated.status}.`);
    } catch (err: any) {
      toast.error("Failed to toggle card status: " + (err.message || err));
    }
  };

  const filteredWallets = wallets.filter(
    (w) =>
      w.studentName.toLowerCase().includes(rfidSearch.toLowerCase()) ||
      w.rfidTag.toLowerCase().includes(rfidSearch.toLowerCase()) ||
      w.grade.toLowerCase().includes(rfidSearch.toLowerCase())
  );

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mess & Cafeteria Administration"
        subtitle="Manage daily specials, pre-orders, strict allergy blocks, rfid tags, and sales ledgers"
      />

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending Pre-orders"
          value={String(orders.filter(o => o.status === "PENDING").length)}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Allergy Alerts Listed"
          value={String(allergies.length)}
          icon={ShieldAlert}
          tone="warning"
        />
        <StatCard
          label="Today's Revenue"
          value={`₹${orders
            .filter((o) => {
              const oDate = new Date(o.orderDate || o.createdAt);
              const today = new Date();
              const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return oDate >= startOfDay && o.status !== "CANCELLED";
            })
            .reduce((acc, o) => acc + (o.totalAmount || 0), 0)
            .toFixed(2)}`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 max-w-lg">
        {(
          [
            ["orders", "POS Register", CheckCircle],
            ["menu", "Menu Items", Utensils],
            ["wallets", "RFID & Profiles", CreditCard],
            ["reports", "Sales & Safety", TrendingUp],
          ] as const
        ).map(([k, l, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-sm font-semibold">Syncing canteen registry with live database...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: POS VERIFICATION & ORDERS */}
          {tab === "orders" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* POS OTP Register Terminal */}
              <div className="lg:col-span-1 space-y-6">
                <Panel title="Verification POS Register">
                  <form onSubmit={handlePOSVerify} className="space-y-4 text-xs font-sans">
                    <div className="bg-muted/40 p-3.5 rounded-lg border flex gap-2 items-start mb-2">
                      <Info className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Verify pre-orders upon student pickup. Enter the 4-digit OTP or unique Order Number shown on the student's receipt screen.
                      </p>
                    </div>

                    <div>
                      <label className="text-muted-foreground font-bold uppercase tracking-wide block mb-1">Order Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 89472"
                        value={posOrderNumber}
                        onChange={(e) => setPosOrderNumber(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm uppercase tracking-wide focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground font-bold uppercase tracking-wide block mb-1">Verification OTP</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 7412"
                        value={posOtp}
                        onChange={(e) => setPosOtp(e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-center text-lg font-mono font-bold tracking-widest focus:border-accent"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOrder}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {verifyingOrder ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify & Complete Pickup"
                      )}
                    </button>
                  </form>
                </Panel>
              </div>

              {/* Lifecycle orders queue */}
              <div className="lg:col-span-2">
                <Panel title="Active Pre-orders Queue">
                  <div className="space-y-3">
                    {orders
                      .filter(o => o.status !== "COMPLETED" && o.status !== "CANCELLED")
                      .map((o) => (
                        <div key={o._id || o.id} className="flex flex-col sm:flex-row justify-between gap-3 p-4 rounded-xl border border-border bg-card/60">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-foreground text-[13px]">{o.orderNumber}</span>
                              <span className="bg-primary/10 text-primary text-[10px] font-bold font-mono px-2 py-0.5 rounded">
                                OTP: {o.otp}
                              </span>
                            </div>
                            <div className="font-bold text-foreground">
                              {o.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")}
                            </div>
                            <div className="text-muted-foreground">
                              Slot: <strong className="text-foreground">{o.pickupTimeSlot}</strong> · Student ID: {o.studentId?.slice(-6)}
                            </div>
                            {o.notes && <div className="text-[10px] text-muted-foreground bg-muted p-1 px-2 rounded">Note: {o.notes}</div>}
                          </div>

                          <div className="text-right flex flex-col justify-between items-end gap-2 text-xs">
                            <span className="font-bold text-foreground">₹{o.totalAmount?.toFixed(2)}</span>
                            
                            <div className="flex gap-1">
                              {o.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateStatus(o._id || o.id, "ACCEPTED")}
                                  className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded hover:bg-primary/95 text-[10px] transition-all cursor-pointer"
                                >
                                  Accept
                                </button>
                              )}
                              {o.status === "ACCEPTED" && (
                                <button
                                  onClick={() => handleUpdateStatus(o._id || o.id, "IN_PROCESS")}
                                  className="bg-warning text-warning-foreground font-bold px-2.5 py-1 rounded hover:bg-warning/95 text-[10px] transition-all cursor-pointer"
                                >
                                  Process
                                </button>
                              )}
                              {o.status === "IN_PROCESS" && (
                                <button
                                  onClick={() => handleUpdateStatus(o._id || o.id, "READY_FOR_PICKUP")}
                                  className="bg-success text-success-foreground font-bold px-2.5 py-1 rounded hover:bg-success/95 text-[10px] transition-all cursor-pointer"
                                >
                                  Ready
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateStatus(o._id || o.id, "CANCELLED")}
                                className="border border-border text-muted-foreground font-bold px-2 py-1 rounded hover:bg-muted text-[10px] transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {orders.filter(o => o.status !== "COMPLETED" && o.status !== "CANCELLED").length === 0 && (
                      <EmptyState icon={Clock} title="Queue Empty" description="There are no pending pre-orders awaiting preparation or pickup." />
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* TAB 2: MENU ITEM MANAGEMENT */}
          {tab === "menu" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card p-4 rounded-xl border border-border">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    placeholder="Search cafeteria menu items…"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-accent"
                  />
                </div>

                <button
                  onClick={handleOpenAddMenuItem}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Menu Item
                </button>
              </div>

              <Panel title="Cafeteria Menu Directory">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <div key={item._id || item.id} className="rounded-lg border border-border p-4 flex flex-col justify-between hover:shadow transition-shadow relative bg-card/40">
                      <div>
                        {item.image && (
                          <div className="h-32 w-full mb-3 rounded-lg overflow-hidden bg-muted">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-extrabold text-foreground text-sm leading-tight">{item.name}</h3>
                            <span className="text-[10px] text-muted-foreground font-medium">{item.category}</span>
                          </div>
                          <span className="font-extrabold text-accent text-sm">₹{item.price?.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-normal">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.availableToday ? (
                            <span className="text-[9px] font-bold bg-success/15 text-success px-2 py-0.5 rounded-full">Available</span>
                          ) : (
                            <span className="text-[9px] font-bold bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">Unavailable Today</span>
                          )}
                          {item.dietaryTags?.map((tag: string) => (
                            <span key={tag} className="text-[9px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>

                        {item.allergyTags?.length > 0 && (
                          <div className="text-[9px] text-destructive mb-3">
                            <strong>Allergens:</strong> {item.allergyTags.join(", ")}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 border-t border-border/50 pt-3 mt-3">
                        <button
                          onClick={() => handleOpenEditMenuItem(item)}
                          className="flex-1 rounded border border-border bg-background hover:bg-muted text-foreground py-1.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item._id || item.id || "")}
                          className="rounded p-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full">
                      <EmptyState icon={Utensils} title="No items found" description="Adjust search query or register new menu specials." />
                    </div>
                  )}
                </div>
              </Panel>

              {/* Daily mess menu editor panel */}
              <div className="mt-6">
                <Panel title="Weekly Caterer Mess Schedule Menu">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                          <th className="pb-3 pr-4">Day</th>
                          <th className="pb-3 px-4">Breakfast</th>
                          <th className="pb-3 px-4">Lunch</th>
                          <th className="pb-3 px-4">Tea / Snacks</th>
                          <th className="pb-3 px-4">Dinner</th>
                          <th className="pb-3 pl-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {weeklyMenu.map((m, i) => (
                          <tr key={m._id || m.id || i} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4 font-bold text-foreground">{m.day}</td>
                            <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.breakfast}</td>
                            <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.lunch}</td>
                            <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[150px]">{m.snacks}</td>
                            <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.dinner}</td>
                            <td className="py-3.5 pl-4 text-right">
                              <button
                                onClick={() => setEditingMenu(m)}
                                className="rounded bg-accent/10 px-2.5 py-1 font-bold text-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
                              >
                                Modify
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* TAB 3: RFID WALLETS & ALLERGY PROFILES */}
          {tab === "wallets" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RFID Wallets Index */}
              <div className="lg:col-span-2 space-y-6">
                <Panel
                  title="RFID Contactless Canteen Cards"
                  action={
                    <div className="relative w-48 sm:w-60">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        placeholder="Search by student or tag…"
                        value={rfidSearch}
                        onChange={(e) => setRfidSearch(e.target.value)}
                        className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:border-accent"
                      />
                    </div>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                          <th className="pb-3 pr-4">Student Name</th>
                          <th className="pb-3 px-4">RFID Tag</th>
                          <th className="pb-3 px-4 text-center">Balance</th>
                          <th className="pb-3 px-4">Card Status</th>
                          <th className="pb-3 pl-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredWallets.map((w, i) => (
                          <tr key={w._id || w.id || i} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4 font-bold text-foreground">
                              {w.studentName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">{w.rfidTag}</td>
                            <td className="py-3.5 px-4 text-center font-bold">
                              <span className={w.balance < 10 ? "text-red-500" : "text-foreground"}>
                                ₹{w.balance.toFixed(2)}
                              </span>
                              {w.balance < 10 && (
                                <span className="ml-1 text-[8px] font-bold text-red-500 uppercase tracking-wide">
                                  Low
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  w.status === "Active"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                                }`}
                              >
                                {w.status}
                              </span>
                            </td>
                            <td className="py-3.5 pl-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedWalletId(w._id || w.id || "");
                                  setShowTopupModal(true);
                                }}
                                disabled={w.status === "Frozen"}
                                className="rounded bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent hover:bg-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Top Up
                              </button>
                              <button
                                onClick={() => handleToggleFreeze(w)}
                                className={`rounded p-1 inline-block align-middle hover:bg-muted cursor-pointer ${
                                  w.status === "Active" ? "text-amber-600" : "text-emerald-600"
                                }`}
                              >
                                {w.status === "Active" ? (
                                  <Lock className="h-3.5 w-3.5" />
                                ) : (
                                  <Unlock className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>

              {/* Student Allergy Profiles Index */}
              <div className="lg:col-span-1 space-y-6">
                <Panel
                  title="Dietary Allergy Warnings"
                  action={
                    <button
                      onClick={() => setShowAllergyModal(true)}
                      className="flex items-center gap-1 text-[10px] text-accent hover:underline font-bold"
                    >
                      <Plus className="h-3 w-3" /> Log Allergy
                    </button>
                  }
                >
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {allergies.map((a, i) => (
                      <div key={a._id || a.id || i} className="p-3 rounded-lg border border-border bg-card/30 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-foreground">{a.studentName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                            a.severity === "High" ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-warning/10 text-warning"
                          }`}>{a.severity} Risk</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Preference: <strong>{a.foodPreference || "Jain/Veg"}</strong></p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(a.allergies || a.allergens || []).map((alg, idx) => (
                            <span key={idx} className="rounded bg-destructive/10 text-destructive text-[8px] font-bold px-1.5 py-0.5 border border-destructive/10">
                              {alg}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {allergies.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground">No dietary allergy warning profiles.</div>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* TAB 4: SALES REPORTS & SAFETY CONFIG */}
          {tab === "reports" && (
            <div className="space-y-6">
              {/* Canteen Safety Configuration Card */}
              <Panel title="Cafeteria Operational Safety & Protocols">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs font-sans">
                  <div>
                    <h4 className="font-bold text-foreground text-sm mb-1">Cafeteria Strict Allergy Safeguard</h4>
                    <p className="text-muted-foreground leading-normal mb-4">
                      When strict safety protocols are enabled, ordering items containing allergens matching a student's medical profile is instantly blocked at checkout. Otherwise, a warning dialog is displayed requesting user validation.
                    </p>
                    
                    <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border/80">
                      <ShieldAlert className="h-5 w-5 text-accent animate-pulse" />
                      <div className="flex-1">
                        <div className="font-bold text-foreground">Strict Allergy Block</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Enforce database-level blocker on orders containing matched allergens.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.strictAllergyMode}
                        onChange={(e) => handleToggleStrictMode(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-border text-primary outline-none focus:ring-accent cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-l border-border/60 pl-6">
                    <h5 className="font-bold text-foreground">Canteen Ledgers & Export Utilities</h5>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Generate official canteen daily sales summaries, ticket tallies, and RFID wallet credit/debit transaction balance reports in PDF or spreadsheet format.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <a
                        href="/api/v1/canteen/exports/pdf?reportType=sales"
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted font-bold text-xs py-2 px-3 transition-all cursor-pointer text-foreground"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" /> Export PDF (Sales)
                      </a>
                      <a
                        href="/api/v1/canteen/exports/excel?reportType=sales"
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted font-bold text-xs py-2 px-3 transition-all cursor-pointer text-foreground"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" /> Export Excel (Sales)
                      </a>
                      <a
                        href="/api/v1/canteen/exports/pdf?reportType=transactions"
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted font-bold text-xs py-2 px-3 transition-all cursor-pointer text-foreground"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" /> Export PDF (RFID Ledger)
                      </a>
                      <a
                        href="/api/v1/canteen/exports/excel?reportType=transactions"
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted font-bold text-xs py-2 px-3 transition-all cursor-pointer text-foreground"
                      >
                        <Download className="h-3.5 w-3.5 text-accent" /> Export Excel (RFID Ledger)
                      </a>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Sales Tally & analytics leaderboard */}
              <Panel
                title="Revenue Analytics & Tallies"
                action={
                  <select
                    value={salesRange}
                    onChange={(e) => setSalesRange(e.target.value as any)}
                    className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:border-accent"
                  >
                    <option value="1">Today's Sales</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                  </select>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-4">
                    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-3 flex flex-col justify-between h-full">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accumulated Sales Revenue</span>
                        <h2 className="text-3xl font-black text-foreground">
                          ₹{(salesReport?.revenue || 0).toFixed(2)}
                        </h2>
                      </div>
                      <div className="pt-4 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Meals Prepared:</span>
                          <span className="font-bold text-foreground">{salesReport?.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tapped Ticket Average:</span>
                          <span className="font-bold text-foreground">
                            ₹{((salesReport?.revenue || 0) / Math.max(1, salesReport?.totalOrders || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Popular Menu Items Leaderboard
                      </h4>
                      <div className="space-y-3">
                        {salesReport?.popularItems?.map((itemObj, index) => {
                          const maxCount = Math.max(...(salesReport.popularItems.map(o => o.count) || [1]));
                          const percentage = Math.round((itemObj.count / maxCount) * 100);
                          return (
                            <div key={index} className="space-y-1 text-xs">
                              <div className="flex justify-between font-semibold text-foreground text-[11px]">
                                <span>{itemObj.item}</span>
                                <span>{itemObj.count} sold (₹{(itemObj.revenue || 0).toFixed(2)})</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-accent transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {(!salesReport?.popularItems || salesReport.popularItems.length === 0) && (
                          <div className="text-center text-xs text-muted-foreground py-6">No items sold during this timeframe.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </>
      )}

      {/* Modal: Edit Mess Menu */}
      {editingMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingMenu(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border"
          >
            <div className="flex justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                Update {editingMenu.day} Mess Menu
              </h2>
              <button
                onClick={() => setEditingMenu(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
              >
                <span>✕</span>
              </button>
            </div>
            <form onSubmit={handleUpdateMenu} className="space-y-4 text-xs font-sans">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Breakfast (07:30 AM)</label>
                <textarea
                  required
                  rows={2}
                  value={editingMenu.breakfast}
                  onChange={(e) => setEditingMenu({ ...editingMenu, breakfast: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Lunch (12:30 PM)</label>
                <textarea
                  required
                  rows={2}
                  value={editingMenu.lunch}
                  onChange={(e) => setEditingMenu({ ...editingMenu, lunch: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">
                    Snacks & Beverages (04:30 PM)
                  </label>
                  <input
                    required
                    value={editingMenu.snacks}
                    onChange={(e) => setEditingMenu({ ...editingMenu, snacks: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-muted-foreground">Dinner (07:30 PM)</label>
                  <input
                    required
                    value={editingMenu.dinner}
                    onChange={(e) => setEditingMenu({ ...editingMenu, dinner: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-4"
              >
                Save Schedule Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Menu Item Add/Edit Editor */}
      {showMenuEditorModal && editingMenuItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => {
            setShowMenuEditorModal(false);
            setEditingMenuItem(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Utensils className="h-4.5 w-4.5 text-accent" />
                {editingMenuItem._id || editingMenuItem.id ? "Edit Cafeteria Menu Item" : "Add New Cafeteria Item"}
              </h2>
              <button
                onClick={() => {
                  setShowMenuEditorModal(false);
                  setEditingMenuItem(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
              >
                <span>✕</span>
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editingMenuItem.name}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-accent"
                    placeholder="e.g. Samosa, Veg Burger"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block">Category</label>
                  <select
                    value={editingMenuItem.category}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value as any })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block">Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.10"
                    required
                    value={editingMenuItem.price}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: Number(e.target.value) })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block">Available Today</label>
                  <select
                    value={String(editingMenuItem.availableToday)}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, availableToday: e.target.value === "true" })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-bold uppercase tracking-wider block">Description</label>
                <input
                  type="text"
                  value={editingMenuItem.description || ""}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 outline-none focus:border-accent"
                  placeholder="e.g. Spiced potato pastry fried to golden crispiness..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-bold uppercase tracking-wider block">Item Image (File Attachment)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setMenuItemImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-muted-foreground border border-dashed p-2 rounded-lg"
                />
              </div>

              {/* Nutrition inputs */}
              <div className="border-t border-border pt-3">
                <label className="text-muted-foreground font-bold uppercase tracking-wider block mb-2">Nutritional Values</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Calories (kcal)", "calories"],
                    ["Protein (g)", "protein"],
                    ["Carbohydrates (g)", "carbohydrates"],
                    ["Fat (g)", "fat"],
                    ["Sugar (g)", "sugar"],
                    ["Fiber (g)", "fiber"]
                  ].map(([label, key]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-[10px] text-muted-foreground block">{label}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingMenuItem.nutrition[key as keyof typeof editingMenuItem.nutrition] || 0}
                        onChange={(e) => setEditingMenuItem({
                          ...editingMenuItem,
                          nutrition: {
                            ...editingMenuItem.nutrition,
                            [key]: Number(e.target.value)
                          }
                        })}
                        className="h-8 w-full rounded border border-border bg-background px-2 text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preference / Allergy Tags */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Dietary Preferences</label>
                  <div className="space-y-1 max-h-24 overflow-y-auto border p-2 rounded-lg bg-muted/20">
                    {["Vegetarian", "Vegan", "Jain", "Egg Included", "Non-Vegetarian"].map((pref) => {
                      const active = editingMenuItem.dietaryTags?.includes(pref);
                      return (
                        <label key={pref} className="flex items-center gap-1.5 cursor-pointer py-0.5 text-[10px]">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              const newTags = active
                                ? editingMenuItem.dietaryTags.filter((t) => t !== pref)
                                : [...(editingMenuItem.dietaryTags || []), pref];
                              setEditingMenuItem({ ...editingMenuItem, dietaryTags: newTags });
                            }}
                            className="rounded text-primary h-3.5 w-3.5 border-border"
                          />
                          <span className="text-foreground">{pref}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Allergen Warning Labels</label>
                  <div className="space-y-1 max-h-24 overflow-y-auto border p-2 rounded-lg bg-muted/20">
                    {["Contains Milk", "Contains Peanuts", "Contains Gluten", "Contains Soy", "Contains Eggs"].map((allergen) => {
                      const active = editingMenuItem.allergyTags?.includes(allergen);
                      return (
                        <label key={allergen} className="flex items-center gap-1.5 cursor-pointer py-0.5 text-[10px]">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              const newTags = active
                                ? editingMenuItem.allergyTags.filter((t) => t !== allergen)
                                : [...(editingMenuItem.allergyTags || []), allergen];
                              setEditingMenuItem({ ...editingMenuItem, allergyTags: newTags });
                            }}
                            className="rounded text-primary h-3.5 w-3.5 border-border"
                          />
                          <span className="text-foreground">{allergen}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuEditorModal(false);
                    setEditingMenuItem(null);
                  }}
                  className="rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground px-4 py-2 font-semibold shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 font-semibold shadow-sm cursor-pointer"
                >
                  Save Menu Special
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Allergy Warning */}
      {showAllergyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowAllergyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between mb-4 border-b border-border pb-2">
              <h2 className="text-sm font-bold flex items-center gap-1">
                <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0" /> Log New Allergy Alert
              </h2>
              <button
                onClick={() => setShowAllergyModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
              >
                <span>✕</span>
              </button>
            </div>
            <form onSubmit={handleAddAllergy} className="space-y-4 text-xs font-sans">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Select Student Profile</label>
                <select
                  name="studentId"
                  required
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.user?.firstName} {s.user?.lastName} ({s.rollNumber || "Grade/Roll N/A"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">
                  Allergen Warnings (comma separated)
                </label>
                <input
                  name="allergens"
                  required
                  placeholder="e.g. Milk, Peanut, Gluten"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Risk Severity</label>
                <select
                  name="severity"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value="High">High (Strict verification block)</option>
                  <option value="Medium">Medium (System warnings)</option>
                  <option value="Low">Low (Monitored profile)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Chef's Safety Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Crucial: Peanut allergy is highly severe, please double check dessert pastries."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-accent resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2"
              >
                Register Medical Guard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Top-up RFID Wallet */}
      {showTopupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowTopupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-border animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between mb-4 border-b border-border pb-2">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <CreditCard className="h-4.5 w-4.5 text-accent" /> Load RFID Cash Balance
              </h2>
              <button
                onClick={() => setShowTopupModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
              >
                <span>✕</span>
              </button>
            </div>
            <form onSubmit={handleTopup} className="space-y-4 text-xs font-sans">
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Select Student Wallet</label>
                <select
                  name="walletId"
                  defaultValue={selectedWalletId}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.studentName} - Balance: ${w.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted-foreground">Load Amount ($)</label>
                <input
                  name="amount"
                  type="number"
                  required
                  defaultValue="20"
                  min="5"
                  max="500"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2"
              >
                Load Balance Immediately
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
