import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coffee, Utensils, Wallet, Clock, History, AlertTriangle, ShieldAlert, CheckCircle, Info, X } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/canteen")({
  head: () => ({ meta: [{ title: "Canteen & Meals · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"menu" | "orders" | "wallet">("menu");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dietaryProfile, setDietaryProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ strictAllergyMode: false });
  const [loading, setLoading] = useState(false);

  // Cart-based pre-order flow states
  const [cart, setCart] = useState<Record<string, { item: any; quantity: number }>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [timeSlot, setTimeSlot] = useState("12:00 PM");
  const [notes, setNotes] = useState("");
  
  // Checkout alerts states
  const [allergyWarnings, setAllergyWarnings] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Successful checkout receipt states
  const [receipt, setReceipt] = useState<any | null>(null);

  const cartItems = Object.values(cart).filter(c => c.quantity > 0);
  const cartTotal = cartItems.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cartItems.reduce((sum, c) => sum + c.quantity, 0);

  const addToCart = (item: any) => {
    const itemId = item._id || item.id;
    setCart(prev => ({
      ...prev,
      [itemId]: { item, quantity: (prev[itemId]?.quantity || 0) + 1 }
    }));
  };

  const updateCartQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => {
        const next = { ...prev };
        delete next[itemId];
        const remaining = Object.values(next).filter(c => c.quantity > 0);
        if (remaining.length === 0) {
          setShowCheckout(false);
        }
        return next;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], quantity: qty }
      }));
    }
  };

  const fetchWallet = async () => {
    const sid = user?.studentId;
    if (!sid) return; // wallet can only be fetched once studentId is available
    try {
      const wRes = await apiClient<any>(`/canteen/wallets/${sid}`);
      if (wRes) {
        setWallet(wRes);
        setTransactions(wRes.transactions || []);
      }
    } catch (err) {
      console.error("Failed to refresh wallet", err);
    }
  };

  const fetchData = async () => {
    const sid = user?.studentId;
    try {
      const [mRes, oRes, wRes, dRes, sRes, messRes] = await Promise.all([
        apiClient<any>("/canteen/menu-items?availableToday=true"),
        apiClient<any>("/canteen/orders"),
        sid ? apiClient<any>(`/canteen/wallets/${sid}`) : Promise.resolve(null),
        sid ? apiClient<any>(`/canteen/dietary-profiles/${sid}`) : Promise.resolve(null),
        apiClient<any>("/canteen/settings").catch(() => ({ strictAllergyMode: false })),
        apiClient<any>("/canteen/mess-menu").catch(() => []),
      ]);
      setMenuItems(Array.isArray(mRes) ? mRes : mRes?.data || []);
      setOrders(Array.isArray(oRes) ? oRes : oRes?.data || []);
      setWeeklyMenu(Array.isArray(messRes) ? messRes : messRes?.data || []);
      if (wRes) {
        setWallet(wRes);
        setTransactions(wRes.transactions || []);
      }
      if (dRes) {
        setDietaryProfile(dRes);
      }
      if (sRes) {
        setSettings(sRes);
      }
    } catch (err) {
      console.error("Failed to load student canteen data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.studentId]);

  // Refresh wallet balance whenever the student switches to the wallet tab
  // so that parent top-ups appear without a full page reload.
  useEffect(() => {
    if (tab === "wallet") {
      fetchWallet();
    }
  }, [tab]);

  const pendingOrders = orders.filter((o) => ["PENDING", "ACCEPTED", "IN_PROCESS", "READY_FOR_PICKUP"].includes(o.status));

  const handleConfirmCheckout = async (continueAnyway = false) => {
    if (cartItems.length === 0 || !user?.studentId) return;
    
    if (allergyWarnings.length > 0 && !continueAnyway) {
      if (settings.strictAllergyMode) {
        setShowBlockedModal(true);
        return;
      } else {
        setShowWarningModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await apiClient<any>("/canteen/orders", {
        method: "POST",
        data: {
          studentId: user.studentId,
          items: cartItems.map(ci => ({ menuItemId: ci.item._id || ci.item.id, quantity: ci.quantity })),
          pickupTimeSlot: timeSlot,
          notes,
          continueAnyway
        }
      });

      if (response && response.allergyConflict) {
        setAllergyWarnings(response.warnings || []);
        if (settings.strictAllergyMode) {
          setShowBlockedModal(true);
        } else {
          setShowWarningModal(true);
        }
        return;
      }

      if (response && response.orderNumber) {
        toast.success("Pre-order placed successfully!");
        setReceipt(response);
        setTab("orders");
        setCart({});
        setShowCheckout(false);
        fetchData();
      }
      setShowWarningModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Canteen & Meals" subtitle="Browse menu, pre-order meals, and manage your wallet" />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard label="Wallet Balance" value={`₹${(wallet?.balance || 0).toFixed(2)}`} icon={Wallet} tone={(wallet?.balance || 0) < 10 ? "warning" : "success"} />
        <StatCard label="Active Orders" value={String(pendingOrders.length)} icon={Clock} tone="info" />
        <StatCard label="Today's Specials" value={String(menuItems.length)} icon={Utensils} tone="primary" />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["menu", "Daily Menu"],
            ["orders", "My Orders"],
            ["wallet", "Wallet & History"],
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

      {tab === "menu" && (
        <>
          <Panel title="Available Menu">
          {/* Floating Sticky Cart Bar */}
          {cartCount > 0 && (
            <div className="sticky top-4 z-20 mb-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow-lg border border-primary/20 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
                  🛒
                </div>
                <div>
                  <div className="font-extrabold text-sm leading-none">{cartCount} item(s) in cart</div>
                  <div className="text-xs text-primary-foreground/90 mt-1 font-semibold">Total: ₹{cartTotal.toFixed(2)}</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  const studentAllergies = dietaryProfile?.allergies || [];
                  const matched: string[] = [];
                  cartItems.forEach(ci => {
                    const itemAllergyTags = ci.item.allergyTags || [];
                    for (const sa of studentAllergies) {
                      const match = itemAllergyTags.find((tag: string) => tag.toLowerCase().includes(sa.toLowerCase()));
                      if (match) {
                        matched.push(`${ci.item.name}: ${sa}`);
                      }
                    }
                  });
                  setAllergyWarnings(matched);
                  setShowCheckout(true);
                }}
                className="rounded-lg bg-background text-primary px-4 py-2 text-xs font-bold hover:bg-background/95 transition-all shadow-md cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                Confirm Order →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const itemId = item._id || item.id;
              const itemQty = cart[itemId]?.quantity || 0;
              return (
                <div key={itemId} className="rounded-lg border border-border p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative bg-card/50">
                  <div>
                    {item.image && (
                      <div className="h-40 w-full mb-3 rounded-lg overflow-hidden bg-muted">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-foreground text-sm leading-tight">{item.name}</h3>
                      <span className="font-extrabold text-accent text-sm">₹{item.price?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-normal">{item.description || item.category}</p>
                    
                    {/* Nutrition panel */}
                    {item.nutrition && (
                      <div className="grid grid-cols-3 gap-1 mb-3 text-[10px] text-center bg-muted/30 p-2 rounded-lg border border-border/40 font-semibold">
                        <div>
                          <div className="font-bold text-foreground">{item.nutrition.calories || 0}</div>
                          <div className="text-muted-foreground uppercase text-[8px]">Kcal</div>
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{item.nutrition.protein || 0}g</div>
                          <div className="text-muted-foreground uppercase text-[8px]">Protein</div>
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{item.nutrition.carbohydrates || 0}g</div>
                          <div className="text-muted-foreground uppercase text-[8px]">Carbs</div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietaryTags?.map((tag: string) => (
                        <span key={tag} className="text-[9px] font-bold bg-success/15 text-success px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    
                    {item.allergyTags?.length > 0 && (
                      <div className="text-[9px] text-destructive mb-3 bg-destructive/10 p-2 rounded-lg border border-destructive/20 flex gap-1.5 items-start">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div>
                          <strong>Contains allergens:</strong> {item.allergyTags.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {itemQty === 0 ? (
                    <button
                      onClick={() => addToCart(item)}
                      className="mt-4 w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      + Add to Cart
                    </button>
                  ) : (
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 bg-muted/60 px-2 py-1 rounded-lg border border-border">
                        <button 
                          onClick={() => updateCartQty(itemId, itemQty - 1)}
                          className="h-6 w-6 rounded bg-card hover:bg-muted font-bold text-foreground text-xs flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs text-foreground w-6 text-center">{itemQty}</span>
                        <button 
                          onClick={() => updateCartQty(itemId, itemQty + 1)}
                          className="h-6 w-6 rounded bg-card hover:bg-muted font-bold text-foreground text-xs flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                        In Cart
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {menuItems.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={Coffee} title="No items available" description="The canteen menu is currently empty." />
              </div>
            )}
          </div>
        </Panel>

        <div className="mt-8">
          <Panel title="Weekly Caterer Mess Schedule Menu">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                    <th className="pb-3 pr-4">Day</th>
                    <th className="pb-3 px-4">Breakfast</th>
                    <th className="pb-3 px-4">Lunch</th>
                    <th className="pb-3 px-4">Tea / Snacks</th>
                    <th className="pb-3 pl-4">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {weeklyMenu.map((m, i) => (
                    <tr key={m._id || m.id || i} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-foreground">{m.day}</td>
                      <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.breakfast}</td>
                      <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.lunch}</td>
                      <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-[150px]">{m.snacks}</td>
                      <td className="py-3.5 pl-4 text-muted-foreground leading-relaxed max-w-[200px]">{m.dinner}</td>
                    </tr>
                  ))}
                  {weeklyMenu.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No weekly mess schedule menu registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        </>
      )}

      {tab === "orders" && (
        <div className="space-y-6">
          {receipt && (
            <div className="rounded-xl border-2 border-success/30 bg-success/5 p-6 animate-in fade-in zoom-in duration-300">
              <div className="flex gap-3 items-start mb-4">
                <CheckCircle className="h-6 w-6 text-success shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Pre-order Confirmed!</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Show this receipt at the cafeteria counter to collect your order.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-border/60 py-4 my-4 text-xs">
                <div>
                  <div className="text-muted-foreground font-semibold">Order Number</div>
                  <div className="font-mono text-base font-extrabold text-foreground mt-0.5">{receipt.orderNumber}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">Verification OTP</div>
                  <div className="font-mono text-xl font-black text-primary tracking-widest mt-0.5">{receipt.otp}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">Pickup Time Slot</div>
                  <div className="font-bold text-foreground mt-0.5">{receipt.pickupTimeSlot}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold">Total Deducted</div>
                  <div className="font-bold text-foreground mt-0.5">₹{receipt.totalAmount?.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setReceipt(null)} className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer uppercase tracking-wider">Dismiss Receipt</button>
              </div>
            </div>
          )}

          <Panel title="My Orders History">
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id || o._id} className="flex flex-col sm:flex-row justify-between gap-4 rounded-lg border border-border p-4 bg-card/40 hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-extrabold font-mono text-foreground">{o.orderNumber}</strong>
                      {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                        <span className="bg-primary/10 text-primary font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                          OTP: {o.otp}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {o.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ") || "Order Item"}
                    </div>
                    <p className="text-xs text-muted-foreground">Slot: {o.pickupTimeSlot} · Ordered on: {new Date(o.orderDate || o.createdAt).toLocaleString()}</p>
                    {o.notes && <p className="text-[10px] text-muted-foreground bg-muted p-1 px-2 rounded mt-1 max-w-sm">Note: {o.notes}</p>}
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <div className="font-extrabold text-sm text-foreground">₹{o.totalAmount?.toFixed(2)}</div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      ["PENDING", "ACCEPTED", "IN_PROCESS"].includes(o.status) ? "bg-warning/15 text-warning" : 
                      o.status === "READY_FOR_PICKUP" ? "bg-primary/15 text-primary animate-pulse" :
                      o.status === "COMPLETED" ? "bg-success/15 text-success" : 
                      "bg-muted text-muted-foreground"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <EmptyState icon={Utensils} title="No recent orders" description="You haven't placed any orders yet." />
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === "wallet" && (
        <Panel title="Wallet & History">
          <div className="mb-6 rounded-xl bg-accent p-6 text-accent-foreground text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
            <div>
              <p className="text-accent-foreground/80 font-medium mb-1">Available Balance</p>
              <h2 className="text-4xl font-black">₹{(wallet?.balance || 0).toFixed(2)}</h2>
            </div>
            <div className="mt-4 sm:mt-0 text-xs bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm font-mono tracking-wider">
              RFID Tag: {wallet?.rfidTag || 'Not Assigned'}
            </div>
          </div>
          
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-foreground">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t.id || t._id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-card/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${t.type === 'Credit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {t.type === 'Credit' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground">{t.item}</div>
                    <div className="text-[9px] text-muted-foreground">{new Date(t.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className={`font-extrabold text-xs ${t.type === 'Credit' ? 'text-success' : 'text-foreground'}`}>
                  {t.type === 'Credit' ? '+' : '-'}₹{t.amount?.toFixed(2)}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No transaction history available.
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Checkout Modal (replaces Pre-order Config Modal) */}
      {showCheckout && !showWarningModal && !showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-foreground text-base">Confirm Pre-order</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Review your canteen cart & details</p>
              </div>
              <button 
                onClick={() => setShowCheckout(false)} 
                className="h-8 w-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 text-foreground cursor-pointer text-base font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Cart items list */}
              <div>
                <label className="text-muted-foreground font-bold uppercase tracking-wider mb-2 block text-[10px]">Your Items</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {cartItems.map((ci) => {
                    const itemId = ci.item._id || ci.item.id;
                    return (
                      <div key={itemId} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border/40">
                        <div className="flex-1 pr-2">
                          <strong className="text-foreground text-[13px] block">{ci.item.name}</strong>
                          <span className="text-[11px] text-muted-foreground font-semibold">₹{ci.item.price?.toFixed(2)} each</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-card px-2 py-1 rounded border border-border/50">
                            <button 
                              onClick={() => updateCartQty(itemId, ci.quantity - 1)}
                              className="h-5 w-5 rounded bg-muted hover:bg-muted/80 font-bold text-foreground text-[10px] flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs text-foreground w-4 text-center">{ci.quantity}</span>
                            <button 
                              onClick={() => updateCartQty(itemId, ci.quantity + 1)}
                              className="h-5 w-5 rounded bg-muted hover:bg-muted/80 font-bold text-foreground text-[10px] flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-extrabold text-accent text-right w-14 text-[13px]">
                            ₹{(ci.item.price * ci.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block text-[10px]">Pickup Time Slot</label>
                <select 
                  value={timeSlot} 
                  onChange={(e) => setTimeSlot(e.target.value)} 
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 outline-none focus:border-accent text-xs font-semibold text-foreground cursor-pointer"
                >
                  <option value="10:30 AM">10:30 AM (Morning Recess)</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="12:00 PM">12:00 PM (Lunch Break)</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="1:00 PM">01:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-muted-foreground font-bold uppercase tracking-wider mb-1.5 block text-[10px]">Preparation Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Extra napkins, no cheese" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 outline-none focus:border-accent text-xs text-foreground" 
                />
              </div>

              <div className="border-t border-border pt-3 mt-2 flex justify-between items-center text-sm font-bold shrink-0">
                <span className="text-muted-foreground">Grand Total:</span>
                <span className="font-black text-accent text-base">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-border pt-3 mt-4 shrink-0">
              <button
                disabled={loading || cartItems.length === 0}
                onClick={() => {
                  const studentAllergies = dietaryProfile?.allergies || [];
                  const matched: string[] = [];
                  cartItems.forEach(ci => {
                    const itemAllergyTags = ci.item.allergyTags || [];
                    for (const sa of studentAllergies) {
                      const match = itemAllergyTags.find((tag: string) => tag.toLowerCase().includes(sa.toLowerCase()));
                      if (match) {
                        matched.push(`${ci.item.name} contains ingredient: ${sa}`);
                      }
                    }
                  });

                  if (matched.length > 0) {
                    setAllergyWarnings(matched);
                    if (settings.strictAllergyMode) {
                      setShowBlockedModal(true);
                    } else {
                      setShowWarningModal(true);
                    }
                  } else {
                    handleConfirmCheckout(false);
                  }
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl shadow transition-all active:scale-95 flex items-center justify-center cursor-pointer text-xs uppercase tracking-wider"
              >
                Confirm Pre-order (₹{cartTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allergy Warning Dialog Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-destructive/20 animate-in zoom-in-95 duration-200">
            <div className="flex gap-2 items-center text-destructive mb-3">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
              <h3 className="font-extrabold text-sm">Allergy Alert Triggered!</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Your profile contains allergens matching this meal choice:
            </p>

            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-xs text-destructive space-y-1 mb-5">
              {allergyWarnings.map((warn, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="font-bold">•</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 font-semibold text-xs">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                }}
                className="flex-1 rounded-lg border border-border bg-background hover:bg-muted py-2.5 text-muted-foreground cursor-pointer"
              >
                Cancel Order
              </button>
              <button
                onClick={() => handleConfirmCheckout(true)}
                className="flex-1 rounded-lg bg-destructive text-white hover:bg-destructive/90 py-2.5 cursor-pointer"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allergy Blocked Modal (Strict Mode) */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-destructive/30 animate-in zoom-in-95 duration-200">
            <div className="flex gap-2 items-center text-destructive mb-3">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              <h3 className="font-extrabold text-sm">Order Blocked (Strict Allergy Mode)</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Cafeteria administration has enabled <strong>Strict Allergy Mode</strong>. Checkout is locked for meals containing allergens matching your dietary profile.
            </p>

            <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-xs text-destructive space-y-1 mb-5">
              {allergyWarnings.map((warn, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="font-bold">•</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowBlockedModal(false);
                setShowCheckout(false);
              }}
              className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 text-xs font-bold cursor-pointer"
            >
              Go Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
