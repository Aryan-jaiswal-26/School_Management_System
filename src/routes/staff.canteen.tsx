import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Utensils, Clock, CheckCircle, TrendingUp, Search } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/staff/canteen")({
  head: () => ({ meta: [{ title: "Staff Canteen Dashboard · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"active" | "completed" | "summary">("active");
  const [dashboard, setDashboard] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const [dRes, oRes] = await Promise.all([
        apiClient<any>("/canteen/dashboard"),
        apiClient<any>("/canteen/orders"),
      ]);
      setDashboard(dRes?.data || dRes);
      setOrders(Array.isArray(oRes) ? oRes : oRes?.data || []);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeOrders = orders.filter((o) => ["PLACED", "PREPARING", "READY"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const filteredActive = activeOrders.filter(
    (o) => o.item_name?.toLowerCase().includes(search.toLowerCase()) || 
           o.status?.toLowerCase().includes(search.toLowerCase())
  );

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient(`/canteen/orders/${id}/status`, {
        method: "PATCH",
        data: { status: newStatus }
      });
      toast.success(`Order marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Canteen Staff Portal" subtitle="Manage active orders and fulfill meals" />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Pending Orders" value={String(dashboard?.pendingOrders || 0)} icon={Clock} tone="warning" />
        <StatCard label="Today's Orders" value={String(dashboard?.todaysOrders || 0)} icon={Utensils} tone="info" />
        <StatCard label="Revenue" value={`$${(dashboard?.revenue || 0).toFixed(2)}`} icon={TrendingUp} tone="success" />
        <StatCard label="Items in Menu" value={String(dashboard?.activeItems || 0)} icon={CheckCircle} tone="primary" />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["active", "Active Orders"],
            ["completed", "Completed Today"],
            ["summary", "Sales Summary"],
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

      {tab === "active" && (
        <Panel title="Order Fulfillment">
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter orders by name or status..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActive.map((o) => (
              <div key={o.id} className="rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{o.item_name} <span className="text-muted-foreground text-sm font-normal">x{o.quantity}</span></h3>
                    <p className="text-sm text-muted-foreground">Slot: {o.meal_slot} · Ordered: {new Date(o.created_at).toLocaleTimeString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    o.status === "PLACED" ? "bg-accent/10 text-accent" : 
                    o.status === "PREPARING" ? "bg-warning/10 text-warning" : 
                    "bg-success/10 text-success"
                  }`}>
                    {o.status}
                  </span>
                </div>
                
                {o.allergy_warnings?.length > 0 && (
                  <div className="mb-3 text-xs bg-destructive/10 text-destructive p-2 rounded-md font-medium">
                    ⚠️ Allergy Warning: {o.allergy_warnings.join(", ")}
                  </div>
                )}
                
                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  {o.status === "PLACED" && (
                    <button onClick={() => updateOrderStatus(o.id, "PREPARING")} className="flex-1 rounded-lg bg-warning/10 py-2 text-sm font-medium text-warning hover:bg-warning/20">
                      Start Preparing
                    </button>
                  )}
                  {o.status === "PREPARING" && (
                    <button onClick={() => updateOrderStatus(o.id, "READY")} className="flex-1 rounded-lg bg-accent/10 py-2 text-sm font-medium text-accent hover:bg-accent/20">
                      Mark Ready
                    </button>
                  )}
                  {o.status === "READY" && (
                    <button onClick={() => updateOrderStatus(o.id, "COMPLETED")} className="flex-1 rounded-lg bg-success py-2 text-sm font-medium text-success-foreground hover:bg-success/90">
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredActive.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={CheckCircle} title="All caught up!" description="There are no active orders to fulfill right now." />
              </div>
            )}
          </div>
        </Panel>
      )}

      {tab === "completed" && (
        <Panel title="Completed Orders">
          <div className="space-y-3">
            {completedOrders.map((o) => (
              <div key={o.id} className="flex justify-between items-center rounded-lg border border-border p-4 opacity-75">
                <div>
                  <h3 className="font-semibold">{o.item_name} <span className="text-muted-foreground font-normal">x{o.quantity}</span></h3>
                  <p className="text-sm text-muted-foreground">Completed at: {new Date(o.updated_at).toLocaleTimeString()}</p>
                </div>
                <div className="font-medium text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Delivered
                </div>
              </div>
            ))}
            {completedOrders.length === 0 && (
              <EmptyState icon={Utensils} title="No completed orders" description="Orders completed today will appear here." />
            )}
          </div>
        </Panel>
      )}

      {tab === "summary" && (
        <Panel title="Today's Sales Summary">
          {dashboard?.popularItems?.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium">Popular Items</h3>
              {dashboard.popularItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="font-medium">{item.item}</div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Sold: <span className="font-semibold text-foreground">{item.count}</span></span>
                    <span className="text-muted-foreground">Rev: <span className="font-semibold text-success">${item.revenue.toFixed(2)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No data available" description="Sales summary will appear once orders are placed." />
          )}
        </Panel>
      )}
    </div>
  );
}
