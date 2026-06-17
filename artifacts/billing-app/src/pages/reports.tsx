import React, { useState, useEffect } from "react";
import { Download, TrendingUp, Wallet, CreditCard, AlertCircle, BarChart2, PieChart as PieIcon, X } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { storage, Bill, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

type Range = "today" | "week" | "month" | "30days" | "all";

function getStartDate(range: Range): Date | null {
  const now = new Date();
  if (range === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (range === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d; }
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "30days") { const d = new Date(now); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d; }
  return null;
}

const rangeLabels: Record<Range, string> = {
  today: "Today", week: "Last 7 Days", month: "This Month", "30days": "Last 30 Days", all: "All Time",
};

type DayData = { date: string; cash: number; online: number; credit: number };

function buildChartData(bills: Bill[]): DayData[] {
  const map = new Map<string, DayData>();
  const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  bills.forEach((b) => {
    const key = fmt(b.createdAt);
    const existing = map.get(key) ?? { date: key, cash: 0, online: 0, credit: 0 };
    if (b.paymentMethod === "cash") existing.cash += b.total;
    else if (b.paymentMethod === "upi" || b.paymentMethod === "card") existing.online += b.total;
    else if (b.paymentMethod === "credit") existing.credit += b.total;
    map.set(key, existing);
  });
  return Array.from(map.values()).reverse();
}

const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-600 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800 ml-auto pl-4">{formatCurrency(Number(p.value), currency)}</span>
        </div>
      ))}
    </div>
  );
};

const paymentMethodColor: Record<string, string> = {
  cash: "bg-green-100 text-green-700", upi: "bg-blue-100 text-blue-700",
  card: "bg-violet-100 text-violet-700", credit: "bg-red-100 text-red-700",
};

export default function ReportsPage() {
  const { settings } = useShopSettings();
  const [bills, setBills] = useState<Bill[]>([]);
  const [range, setRange] = useState<Range>("month");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<"inventory" | "customers">("inventory");
  const [inventory, setInventory] = useState(storage.getInventory());

  useEffect(() => {
    setBills(storage.getBills());
    setInventory(storage.getInventory());
    const handler = () => setInventory(storage.getInventory());
    window.addEventListener("inventory-updated", handler);
    return () => window.removeEventListener("inventory-updated", handler);
  }, []);

  const startDate = getStartDate(range);
  const filtered = startDate ? bills.filter((b) => new Date(b.createdAt) >= startDate) : bills;

  const totalRevenue = filtered.reduce((acc, b) => acc + b.total, 0);
  const cashSales = filtered.filter((b) => b.paymentMethod === "cash").reduce((acc, b) => acc + b.total, 0);
  const upiSales = filtered.filter((b) => ["upi", "card"].includes(b.paymentMethod)).reduce((acc, b) => acc + b.total, 0);
  const creditGiven = filtered.filter((b) => b.paymentMethod === "credit").reduce((acc, b) => acc + b.total, 0);

  const totalCgst = filtered.reduce((acc, b) => acc + b.cgst, 0);
  const totalSgst = filtered.reduce((acc, b) => acc + b.sgst, 0);
  const totalIgst = filtered.reduce((acc, b) => acc + b.igst, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const taxableSales = filtered.filter((b) => b.gstEnabled).reduce((acc, b) => acc + b.subtotal, 0);

  const chartData = buildChartData(filtered);

  // ── Analytics data ────────────────────────────────────────────────────────
  // Inventory: stock levels per product (top 12 for readability)
  const inventoryChartData = [...inventory]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 12)
    .map(item => ({
      name: item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name,
      stock: item.stock,
      lowAlert: item.lowStockThreshold,
    }));

  // Customer spend: group all bills by customerName, sum totals
  const customerSpendMap = new Map<string, number>();
  bills.forEach(b => {
    const name = b.customerName || "Walk-in";
    customerSpendMap.set(name, (customerSpendMap.get(name) ?? 0) + b.total);
  });
  const customerChartData = [...customerSpendMap.entries()]
    .map(([name, total]) => ({ name: name.length > 14 ? name.slice(0, 13) + "…" : name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("No data to export for the selected period."); return; }
    const headers = ["Bill#","Date","Customer","Items","Subtotal","Discount","GST Enabled","GST Rate%","CGST","SGST","IGST","Total GST","Grand Total","Payment Method","Status"];
    const rows = filtered.map((b) => [
      b.billNumber, new Date(b.createdAt).toLocaleDateString("en-IN"), b.customerName || "",
      b.items.length, b.subtotal.toFixed(2), b.discount.toFixed(2),
      b.gstEnabled ? "Yes" : "No", b.gstEnabled ? b.gstRate : 0,
      b.cgst.toFixed(2), b.sgst.toFixed(2), b.igst.toFixed(2),
      (b.cgst + b.sgst + b.igst).toFixed(2), b.total.toFixed(2), b.paymentMethod, b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${rangeLabels[range].replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Tax report downloaded successfully.");
  };

  const sym = settings.currency === 'USD' ? '$' : '₹';

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Reports & Bookkeeping</h1>
          <p className="text-slate-500 text-sm mt-0.5">Financial overview for {rangeLabels[range].toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAnalyticsOpen(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
            <PieIcon size={15} /> Graph Analytics
          </Button>
          <Button onClick={exportCSV} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Download size={15} /> Export Tax CSV
          </Button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {(Object.keys(rangeLabels) as Range[]).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${range === r ? "bg-primary text-white border-primary shadow-sm" : "bg-white/80 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}>
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Net Revenue", value: formatCurrency(totalRevenue, settings.currency), sub: `${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`, color: "text-primary", icon: TrendingUp, bg: "bg-primary/8" },
          { label: "Cash Sales", value: formatCurrency(cashSales, settings.currency), sub: `${filtered.filter(b => b.paymentMethod === "cash").length} bills`, color: "text-green-700", icon: Wallet, bg: "bg-green-50" },
          { label: "UPI / Card", value: formatCurrency(upiSales, settings.currency), sub: `${filtered.filter(b => ["upi","card"].includes(b.paymentMethod)).length} bills`, color: "text-blue-700", icon: CreditCard, bg: "bg-blue-50" },
          { label: "Credit (Udhaar)", value: formatCurrency(creditGiven, settings.currency), sub: `${filtered.filter(b => b.paymentMethod === "credit").length} bills`, color: "text-red-600", icon: AlertCircle, bg: "bg-red-50" },
        ].map((card) => (
          <div key={card.label} className="glass-panel p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}><card.icon size={18} className={card.color} /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="glass-panel p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Daily Sales Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cash vs. Online vs. Credit over time</p>
          </div>
        </div>
        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <BarChart2 size={32} className="text-slate-300 mb-2" />
            <p className="text-sm">Not enough data to draw a chart for this period</p>
            <p className="text-xs mt-1">Finalize more bills to see trends here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.18} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCredit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.14} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} width={52} />
              <Tooltip content={<CustomTooltip currency={settings.currency} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: "#64748b" }} />
              <Area type="monotone" dataKey="cash" name="Cash" stroke="#6366f1" strokeWidth={2} fill="url(#gradCash)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#6366f1" }} />
              <Area type="monotone" dataKey="online" name="Online (UPI/Card)" stroke="#06b6d4" strokeWidth={2} fill="url(#gradOnline)" dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#06b6d4" }} />
              <Area type="monotone" dataKey="credit" name="Credit" stroke="#ef4444" strokeWidth={2} fill="url(#gradCredit)" dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#ef4444" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bills table + GST */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Sales History</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Bill#</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600">Items</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-slate-600">Payment</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center"><BarChart2 size={28} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400 text-sm">No bills for this period</p></td></tr>
                ) : (
                  [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((bill) => (
                    <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-primary">{bill.billNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td className="py-2.5 px-3 text-slate-700">{bill.customerName || "—"}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{bill.items.length}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${paymentMethodColor[bill.paymentMethod] ?? "bg-slate-100 text-slate-600"}`}>{bill.paymentMethod}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{formatCurrency(bill.total, settings.currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Summary */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">GST Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5">For {rangeLabels[range].toLowerCase()}</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Taxable Sales", value: taxableSales, color: "text-slate-800" },
              { label: "Total CGST", value: totalCgst, color: "text-indigo-600" },
              { label: "Total SGST", value: totalSgst, color: "text-violet-600" },
              { label: "Total IGST", value: totalIgst, color: "text-orange-500" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-sm text-slate-600">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{formatCurrency(row.value, settings.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold text-slate-700">Total GST Collected</span>
              <span className="text-base font-extrabold text-primary">{formatCurrency(totalGst, settings.currency)}</span>
            </div>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-200/60">
            <p className="text-xs text-slate-400 leading-relaxed">Use "Export Tax CSV" to download a full bill-level breakdown for GST filing.</p>
          </div>
        </div>
      </div>

      {/* ── Graph Analytics Modal ─────────────────────────────────────────────── */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Graph Analytics</h2>
                <p className="text-xs text-slate-500 mt-0.5">Deep-dive into inventory performance & customer behaviour</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Tab switcher */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setAnalyticsTab("inventory")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${analyticsTab === "inventory" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setAnalyticsTab("customers")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${analyticsTab === "customers" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    Customers
                  </button>
                </div>
                <button onClick={() => setAnalyticsOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto p-6">
              {analyticsTab === "inventory" && (
                <div className="space-y-6">
                  {/* Bar chart: stock levels */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Stock Level by Product</h3>
                    <p className="text-xs text-slate-400 mb-4">Current units in stock — amber line shows low-stock alert threshold</p>
                    {inventoryChartData.length === 0 ? (
                      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No inventory data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={inventoryChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
                                  <p className="font-bold text-slate-700 mb-1">{label}</p>
                                  <p className="text-indigo-600">Stock: <strong>{payload[0]?.value}</strong> units</p>
                                  {payload[1] && <p className="text-amber-600">Alert at: <strong>{payload[1]?.value}</strong></p>}
                                </div>
                              );
                            }}
                          />
                          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: "#64748b" }} />
                          <Bar dataKey="stock" name="Current Stock" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            {inventoryChartData.map((_, i) => (
                              <Cell key={i} fill={inventoryChartData[i].stock <= inventoryChartData[i].lowAlert ? "#ef4444" : inventoryChartData[i].stock <= inventoryChartData[i].lowAlert * 2 ? "#f59e0b" : "#6366f1"} />
                            ))}
                          </Bar>
                          <Bar dataKey="lowAlert" name="Low-Stock Alert" fill="#fcd34d" radius={[4, 4, 0, 0]} opacity={0.5} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Pie chart: stock distribution by category */}
                  {(() => {
                    const catMap = new Map<string, number>();
                    inventory.forEach(item => { catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.stock); });
                    const catData = [...catMap.entries()].map(([name, value]) => ({ name, value }));
                    return catData.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-1">Stock Distribution by Category</h3>
                        <p className="text-xs text-slate-400 mb-4">Total units held per product category</p>
                        <div className="flex items-center gap-8">
                          <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                              <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                                {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(val: any) => [`${val} units`, ""]} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col gap-2">
                            {catData.map((d, i) => (
                              <div key={d.name} className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="text-slate-700 font-medium">{d.name}</span>
                                <span className="text-slate-400 ml-auto pl-4">{d.value} units</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {analyticsTab === "customers" && (
                <div className="space-y-6">
                  {/* Bar chart: top customers by spend */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Top Customers by Total Purchase</h3>
                    <p className="text-xs text-slate-400 mb-4">Ranked by cumulative spend across all bills</p>
                    {customerChartData.length === 0 ? (
                      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No customer billing data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={customerChartData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
                                  <p className="font-bold text-slate-700 mb-1">{label}</p>
                                  <p className="text-primary">Total Spend: <strong>{formatCurrency(Number(payload[0]?.value), settings.currency)}</strong></p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="total" name="Total Spend" radius={[0, 4, 4, 0]}>
                            {customerChartData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Pie chart: payment method distribution */}
                  {(() => {
                    const pmMap = new Map([["cash", 0], ["upi", 0], ["card", 0], ["credit", 0]]);
                    bills.forEach(b => pmMap.set(b.paymentMethod, (pmMap.get(b.paymentMethod) ?? 0) + b.total));
                    const pmData = [...pmMap.entries()].filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.toUpperCase(), value }));
                    const pmColors: Record<string, string> = { CASH: "#10b981", UPI: "#6366f1", CARD: "#8b5cf6", CREDIT: "#ef4444" };
                    return pmData.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-1">Revenue Split by Payment Method</h3>
                        <p className="text-xs text-slate-400 mb-4">All-time revenue grouped by how customers paid</p>
                        <div className="flex items-center gap-8">
                          <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                              <Pie data={pmData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                                {pmData.map((d) => <Cell key={d.name} fill={pmColors[d.name] ?? "#6366f1"} />)}
                              </Pie>
                              <Tooltip formatter={(val: any) => [formatCurrency(Number(val), settings.currency), ""]} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col gap-2">
                            {pmData.map((d) => (
                              <div key={d.name} className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: pmColors[d.name] ?? "#6366f1" }} />
                                <span className="text-slate-700 font-medium">{d.name}</span>
                                <span className="text-slate-400 ml-auto pl-4">{formatCurrency(d.value, settings.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
