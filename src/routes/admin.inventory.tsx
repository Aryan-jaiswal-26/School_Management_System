import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  X,
  Truck,
  FileText,
  AlertTriangle,
  FolderOpen,
  ArrowRightLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [tab, setTab] = useState<"stock" | "suppliers" | "orders">("stock");
  const [showPOModal, setShowPOModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // States
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [stockRes, suppRes, poRes, dispatchRes] = await Promise.all([
        apiClient<any>("/inventory/stock"),
        apiClient<any>("/inventory/suppliers"),
        apiClient<any>("/inventory/purchase-orders"),
        apiClient<any>("/inventory/dispatch-logs")
      ]);
      setStockItems(stockRes?.data || []);
      setSuppliers(suppRes?.data || []);
      setPurchaseOrders(poRes?.data || []);
      setDispatchLogs(dispatchRes?.data || []);
    } catch (err) {
      toast.error("Failed to load inventory data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePO = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item = fd.get("item") as string;
    const supplierName = fd.get("supplier") as string;
    const qty = Number(fd.get("qty"));
    const cost = Number(fd.get("cost"));

    try {
      await apiClient("/inventory/purchase-orders", {
        method: "POST",
        data: {
          poNo: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          item,
          supplier: supplierName,
          qty,
          cost,
          date: new Date().toISOString().split("T")[0],
          status: "Pending Approval"
        }
      });
      toast.success("Purchase Order created!");
      setShowPOModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to create PO");
    }
  };

  const handleDispatchStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const itemId = fd.get("itemId") as string;
    const qty = Number(fd.get("qty"));
    const recipient = fd.get("recipient") as string;

    try {
      await apiClient("/inventory/dispatch", {
        method: "POST",
        data: { itemId, qty, recipient }
      });
      toast.success("Dispatched successfully.");
      setShowDispatchModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to dispatch stock");
    }
  };

  const totalValue = stockItems.reduce((acc, i) => acc + i.stock * 15, 0); // Mock cost per item

  return (
    <div>
      <PageHeader
        title="Asset & Inventory ERP"
        subtitle="Fixed IT systems, uniform stockpiles, science lab gear, and PO registers"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Inventory Items"
          value={String(stockItems.reduce((acc, i) => acc + i.stock, 0))}
          icon={Package}
          tone="info"
        />
        <StatCard
          label="Low Stock Alert"
          value={String(stockItems.filter((i) => i.status !== "In Stock").length)}
          icon={AlertTriangle}
          tone={stockItems.some((i) => i.status === "Reorder Needed") ? "critical" : "warning"}
        />
        <StatCard
          label="Registered Suppliers"
          value={String(suppliers.length)}
          icon={Truck}
          tone="success"
        />
        <StatCard
          label="Stock Book Value"
          value={`$${totalValue}`}
          icon={FileText}
          tone="success"
        />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["stock", "Stock Registry"],
            ["suppliers", "Suppliers Ledger"],
            ["orders", "Procurement & Orders"],
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

      {tab === "stock" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel
              title="Campus Assets & Consumables"
              action={
                <button
                  onClick={() => setShowDispatchModal(true)}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Dispatch Stock
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Item Name</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Warehouse Shelf</th>
                      <th className="pb-3 px-4 text-center">In Stock</th>
                      <th className="pb-3 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stockItems.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold">{i.name}</td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">{i.category}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{i.shelf}</td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {i.stock}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {i.unit}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${i.status === "In Stock" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : i.status === "Low Stock" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300" : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"}`}
                          >
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-1">
            <Panel title="Internal Asset Dispatch Logs">
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-border bg-card space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-medium">{log.date}</span>
                      <span className="font-bold text-foreground">Qty: {log.qty}</span>
                    </div>
                    <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-accent" />
                      {log.item}
                    </div>
                    <div className="text-muted-foreground flex justify-between pt-1 border-t border-border/50">
                      <span>Issued To:</span>
                      <span className="font-medium text-foreground">{log.recipient}</span>
                    </div>
                  </div>
                ))}
                {dispatchLogs.length === 0 && (
                  <EmptyState
                    icon={ClipboardList}
                    title="No dispatch recorded"
                    description="Stock distribution events appear here."
                  />
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <Panel title="Supplier Directories & Catalogs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category} Supplier</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                  <div className="flex justify-between">
                    <span>Contact Person:</span>
                    <span className="font-medium text-foreground">{s.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="font-mono font-medium text-foreground">{s.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium text-foreground">{s.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "orders" && (
        <Panel
          title="Procurement & Purchase Order Registers"
          action={
            <button
              onClick={() => setShowPOModal(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Generate Purchase Order
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase">
                  <th className="pb-3 pr-4">PO Document</th>
                  <th className="pb-3 px-4">Procured Material</th>
                  <th className="pb-3 px-4">Allocated Supplier</th>
                  <th className="pb-3 px-4">Qty</th>
                  <th className="pb-3 px-4">Invoice Value</th>
                  <th className="pb-3 px-4">Order Date</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-xs text-accent">
                      {po.poNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{po.item}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{po.supplier}</td>
                    <td className="py-3.5 px-4 font-semibold text-center">{po.qty}</td>
                    <td className="py-3.5 px-4 font-bold text-foreground">${po.cost}</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{po.date}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <span
                        onClick={() => {
                          if (po.status === "Pending Approval") {
                            setPurchaseOrders((prev) =>
                              prev.map((item) =>
                                item.id === po.id ? { ...item, status: "Approved" } : item,
                              ),
                            );
                            toast.success(`Purchase Order ${po.poNo} approved successfully!`);
                          }
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer capitalize ${po.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 hover:bg-amber-200"}`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {showPOModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPOModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate Purchase Order (PO)</h2>
              <button
                onClick={() => setShowPOModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Material / Asset Name</label>
                <input
                  name="item"
                  required
                  placeholder="e.g. Science Beakers Set"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Allocated Supplier</label>
                <select
                  name="supplier"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {suppliers.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                  <option>SciTech Instruments</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Order Quantity</label>
                  <input
                    name="qty"
                    type="number"
                    required
                    defaultValue="10"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Total Cost ($)</label>
                  <input
                    name="cost"
                    type="number"
                    required
                    defaultValue="300"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold"
              >
                Create Document
              </button>
            </form>
          </div>
        </div>
      )}

      {showDispatchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDispatchModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Dispatch Stock to Campus</h2>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleDispatchStock} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Material</label>
                <select
                  name="itemId"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {stockItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Issue Quantity</label>
                <input
                  name="qty"
                  type="number"
                  required
                  defaultValue="2"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Recipient Dept / Staff Name
                </label>
                <input
                  name="recipient"
                  required
                  placeholder="e.g. Science Lab A (Mrs. Iyer)"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all font-semibold"
              >
                Execute Dispatch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
