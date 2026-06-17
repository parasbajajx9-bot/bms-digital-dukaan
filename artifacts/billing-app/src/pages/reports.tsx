import React, { useState, useEffect } from "react";
import { Download, TrendingUp, Wallet, CreditCard, AlertCircle, BarChart2, X, Activity } from "lucide-react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, BarChart, Bar, PieChart, Pie, Cell,
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

type DayData = { date: string; cash: number; online: number; credit: number; total: number };

function buildChartData(bills: Bill[]): DayData[] {
  const map = new Map<string, DayData>();
  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  bills.forEach(b => {
    const key = fmt(b.createdAt);
    const ex = map.get(key) ?? { date: key, cash: 0, online: 0, credit: 0, total: 0 };
    if (b.paymentMethod === "cash") ex.cash += b.total;
    else if (b.paymentMethod === "upi" || b.paymentMethod === "card") ex.online += b.total;
    else if (b.paymentMethod === "credit") ex.credit += b.total;
    ex.total += b.total;
    map.set(key, ex);
  });
  return Array.from(map.values()).reverse();
}

const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const paymentMethodColor: Record<string, string> = {
  cash: "bg-green-100 text-green-700", upi: "bg-blue-100 text-blue-700",
  card: "bg-violet-100 text-violet-700", credit: "bg-red-100 text-red-700",
};

// Trading-style dark tooltip
const TradingTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs backdrop-blur-sm min-w-[160px]">
      <p className="text-slate-400 font-semibold mb-2 pb-1.5 border-b border-slate-700/60 uppercase tracking-wider">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-white tabular-nums">{formatCurrency(Number(p.value), currency)}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t border-slate-700/60">
          <span className="text-slate-400">Total</span>
          <span className="font-extrabold text-emerald-400 tabular-nums">{formatCurrency(total, currency)}</span>
        </div>
      )}
    </div>
  );
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
  // Always exclude cancelled bills from all financial calculations
  const filtered = (startDate ? bills.filter(b => new Date(b.createdAt) >= startDate) : bills)
    .filter(b => b.status !== 'cancelled');

  const totalRevenue = filtered.reduce((acc, b) => acc + b.total, 0);
  const cashSales = filtered.filter(b => b.paymentMethod === "cash").reduce((acc, b) => acc + b.total, 0);
  const upiSales = filtered.filter(b => ["upi", "card"].includes(b.paymentMethod)).reduce((acc, b) => acc + b.total, 0);
  const creditGiven = filtered.filter(b => b.paymentMethod === "credit").reduce((acc, b) => acc + b.total, 0);

  const totalCgst = filtered.reduce((acc, b) => acc + b.cgst, 0);
  const totalSgst = filtered.reduce((acc, b) => acc + b.sgst, 0);
  const totalIgst = filtered.reduce((acc, b) => acc + b.igst, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const taxableSales = filtered.filter(b => b.gstEnabled).reduce((acc, b) => acc + b.subtotal, 0);

  const chartData = buildChartData(filtered);
  const avgRevenue = chartData.length > 0 ? chartData.reduce((s, d) => s + d.total, 0) / chartData.length : 0;

  const inventoryChartData = [...inventory]
    .sort((a, b) => b.stock - a.stock).slice(0, 12)
    .map(item => ({
      name: item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name,
      stock: item.stock, lowAlert: item.lowStockThreshold,
    }));

  const customerSpendMap = new Map<string, number>();
  bills.forEach(b => {
    const name = b.customerName || "Walk-in";
    customerSpendMap.set(name, (customerSpendMap.get(name) ?? 0) + b.total);
  });
  const customerChartData = [...customerSpendMap.entries()]
    .map(([name, total]) => ({ name: name.length > 14 ? name.slice(0, 13) + "…" : name, total }))
    .sort((a, b) => b.total - a.total).slice(0, 8);

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("No data to export for the selected period."); return; }
    const headers = ["Bill#", "Date", "Customer", "Items", "Subtotal", "Discount", "GST Enabled", "GST Rate%", "CGST", "SGST", "IGST", "Total GST", "Grand Total", "Payment Method", "Status"];
    const rows = filtered.map(b => [
      b.billNumber, new Date(b.createdAt).toLocaleDateString("en-IN"), b.customerName || "",
      b.items.length, b.subtotal.toFixed(2), b.discount.toFixed(2),
      b.gstEnabled ? "Yes" : "No", b.gstEnabled ? b.gstRate : 0,
      b.cgst.toFixed(2), b.sgst.toFixed(2), b.igst.toFixed(2),
      (b.cgst + b.sgst + b.igst).toFixed(2), b.total.toFixed(2), b.paymentMethod, b.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tax-report-${range}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Tax report downloaded.");
  };

  const sym = settings.currency === "USD" ? "$" : "₹";

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Reports & Bookkeeping</h1>
          <p className="text-slate-500 text-sm mt-0.5">Financial overview · {rangeLabels[range]}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAnalyticsOpen(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5 flex-1 md:flex-none">
            <Activity size={15} /> Graph Analytics
          </Button>
          <Button onClick={exportCSV} className="gap-2 bg-primary hover:bg-primary/90 text-white flex-1 md:flex-none">
            <Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {(Object.keys(rangeLabels) as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${range === r ? "bg-primary text-white border-primary shadow-sm" : "bg-white/80 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}>
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Net Revenue", value: formatCurrency(totalRevenue, settings.currency), sub: `${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`, color: "text-primary", Icon: TrendingUp, bg: "bg-primary/8" },
          { label: "Cash Sales", value: formatCurrency(cashSales, settings.currency), sub: `${filtered.filter(b => b.paymentMethod === "cash").length} bills`, color: "text-green-700", Icon: Wallet, bg: "bg-green-50" },
          { label: "UPI / Card", value: formatCurrency(upiSales, settings.currency), sub: `${filtered.filter(b => ["upi", "card"].includes(b.paymentMethod)).length} bills`, color: "text-blue-700", Icon: CreditCard, bg: "bg-blue-50" },
          { label: "Credit (Udhaar)", value: formatCurrency(creditGiven, settings.currency), sub: `${filtered.filter(b => b.paymentMethod === "credit").length} bills`, color: "text-red-600", Icon: AlertCircle, bg: "bg-red-50" },
        ].map(card => (
          <div key={card.label} className="glass-panel p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}><card.Icon size={18} className={card.color} /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Trading-style Revenue Chart ── */}
      <div className="glass-panel p-5 flex-shrink-0">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Revenue Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cash · UPI/Card · Credit  —  {rangeLabels[range]}</p>
          </div>
          {chartData.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Period Avg / Day</p>
              <p className="text-sm font-bold text-slate-700">{formatCurrency(avgRevenue, settings.currency)}</p>
            </div>
          )}
        </div>

        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <BarChart2 size={32} className="text-slate-300" />
            <p className="text-sm font-medium">Not enough data for this period</p>
            <p className="text-xs text-slate-300">Finalize more bills to see trends here</p>
          </div>
        ) : (
          <div className="bg-slate-950/[0.03] rounded-xl border border-slate-100 p-4">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} strokeOpacity={0.7} />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} width={46} />
                <Tooltip content={<TradingTooltip currency={settings.currency} />} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 2", strokeOpacity: 0.5 }} />
                {avgRevenue > 0 && (
                  <ReferenceLine y={avgRevenue} stroke="#6366f1" strokeDasharray="5 3" strokeOpacity={0.35} strokeWidth={1.5}
                    label={{ value: "Avg", position: "insideTopRight", fontSize: 9, fill: "#6366f1", opacity: 0.6 }} />
                )}
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#64748b" }} />
                <Area type="monotoneX" dataKey="cash" name="Cash" stroke="#6366f1" strokeWidth={2} fill="url(#fillCash)"
                  dot={false} activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                <Area type="monotoneX" dataKey="online" name="Online (UPI/Card)" stroke="#06b6d4" strokeWidth={2} fill="url(#fillOnline)"
                  dot={false} activeDot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }} />
                <Area type="monotoneX" dataKey="credit" name="Credit" stroke="#ef4444" strokeWidth={1.5} fill="url(#fillCredit)"
                  strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
                <Line type="monotoneX" dataKey="total" name="Total Revenue" stroke="#10b981" strokeWidth={2}
                  dot={false} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bills table + GST Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Sales History</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  {["Bill#", "Date", "Customer", "Items", "Payment", "Total"].map(h => (
                    <th key={h} className={`py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide ${h === "Total" ? "text-right" : h === "Items" || h === "Payment" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No bills for this period</td></tr>
                ) : (
                  [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(bill => (
                    <tr key={bill.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-primary font-mono text-xs">{bill.billNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-xs">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
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

        <div className="glass-panel p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">GST Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5">{rangeLabels[range]}</p>
          </div>
          {[
            { label: "Taxable Sales", value: taxableSales, color: "text-slate-800" },
            { label: "Total CGST", value: totalCgst, color: "text-indigo-600" },
            { label: "Total SGST", value: totalSgst, color: "text-violet-600" },
            { label: "Total IGST", value: totalIgst, color: "text-orange-500" },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className={`text-sm font-bold ${row.color}`}>{formatCurrency(row.value, settings.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-bold text-slate-700">Total GST</span>
            <span className="text-base font-extrabold text-primary">{formatCurrency(totalGst, settings.currency)}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mt-auto pt-3 border-t border-slate-200/60">
            Use "Export Tax CSV" to download bill-level data for GST filing.
          </p>
        </div>
      </div>

      {/* ── Graph Analytics Modal ── */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Activity size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 leading-none">Graph Analytics</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Inventory & customer performance data</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 bg-slate-100 rounded-lg p-1">
                  {(["inventory", "customers"] as const).map(tab => (
                    <button key={tab} onClick={() => setAnalyticsTab(tab)}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${analyticsTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAnalyticsOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-8">
              {analyticsTab === "inventory" && (
                <>
                  {/* Stock bar chart — trading style */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Stock Level per Product</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Current units in stock · red = out / amber = low</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Healthy</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Low</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Out</span>
                      </div>
                    </div>
                    {inventoryChartData.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No inventory data</div>
                    ) : (
                      <div className="bg-slate-950/[0.025] rounded-xl border border-slate-100 p-4">
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={inventoryChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                            <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} strokeOpacity={0.7} />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
                                    <p className="text-slate-300 font-semibold mb-2">{label}</p>
                                    <p className="text-white">Stock: <strong className="text-emerald-400">{payload[0]?.value} units</strong></p>
                                    {payload[1] && <p className="text-slate-400">Alert below: <strong className="text-amber-400">{payload[1]?.value}</strong></p>}
                                  </div>
                                );
                              }}
                              cursor={{ fill: "#6366f1", fillOpacity: 0.05 }}
                            />
                            <Bar dataKey="stock" name="Stock" radius={[4, 4, 0, 0]} maxBarSize={40}>
                              {inventoryChartData.map((d, i) => (
                                <Cell key={i} fill={d.stock === 0 ? "#ef4444" : d.stock <= d.lowAlert ? "#f59e0b" : "#6366f1"} />
                              ))}
                            </Bar>
                            <Bar dataKey="lowAlert" name="Alert Level" fill="#fcd34d" radius={[4, 4, 0, 0]} opacity={0.35} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Category donut */}
                  {(() => {
                    const catMap = new Map<string, number>();
                    inventory.forEach(item => catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.stock));
                    const catData = [...catMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
                    if (!catData.length) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Category Stock Distribution</h3>
                        <p className="text-xs text-slate-400 mb-4">Units held per category</p>
                        <div className="flex items-center gap-10">
                          <ResponsiveContainer width="45%" height={200}>
                            <PieChart>
                              <Pie data={catData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(val: any, name: any) => [`${val} units`, name]}
                                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#e2e8f0", fontSize: 11 }}
                                labelStyle={{ color: "#94a3b8" }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col gap-2.5 flex-1">
                            {catData.map((d, i) => (
                              <div key={d.name} className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="text-sm text-slate-700 font-medium flex-1">{d.name}</span>
                                <span className="text-sm font-bold text-slate-500 tabular-nums">{d.value} <span className="text-xs font-normal text-slate-400">units</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {analyticsTab === "customers" && (
                <>
                  {/* Top customers horizontal bars */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Top Customers by Spend</h3>
                    <p className="text-xs text-slate-400 mb-4">Cumulative spend across all bills</p>
                    {customerChartData.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No billing data yet</div>
                    ) : (
                      <div className="bg-slate-950/[0.025] rounded-xl border border-slate-100 p-4">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={customerChartData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 0 }} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" horizontal={false} strokeOpacity={0.7} />
                            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                            <YAxis type="category" dataKey="name" tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
                                    <p className="text-slate-300 font-semibold mb-1.5">{label}</p>
                                    <p className="text-white">Total Spend: <strong className="text-emerald-400">{formatCurrency(Number(payload[0]?.value), settings.currency)}</strong></p>
                                  </div>
                                );
                              }}
                              cursor={{ fill: "#6366f1", fillOpacity: 0.05 }}
                            />
                            <Bar dataKey="total" name="Total Spend" radius={[0, 5, 5, 0]} maxBarSize={28}>
                              {customerChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Payment method split donut */}
                  {(() => {
                    const pmMap = new Map([["cash", 0], ["upi", 0], ["card", 0], ["credit", 0]]);
                    bills.forEach(b => pmMap.set(b.paymentMethod, (pmMap.get(b.paymentMethod) ?? 0) + b.total));
                    const pmData = [...pmMap.entries()].filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.toUpperCase(), value }));
                    const pmColors: Record<string, string> = { CASH: "#10b981", UPI: "#6366f1", CARD: "#8b5cf6", CREDIT: "#ef4444" };
                    if (!pmData.length) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Revenue by Payment Method</h3>
                        <p className="text-xs text-slate-400 mb-4">All-time split by how customers paid</p>
                        <div className="flex items-center gap-10">
                          <ResponsiveContainer width="45%" height={200}>
                            <PieChart>
                              <Pie data={pmData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                {pmData.map(d => <Cell key={d.name} fill={pmColors[d.name] ?? "#6366f1"} />)}
                              </Pie>
                              <Tooltip formatter={(val: any, name: any) => [formatCurrency(Number(val), settings.currency), name]}
                                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#e2e8f0", fontSize: 11 }}
                                labelStyle={{ color: "#94a3b8" }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-col gap-2.5 flex-1">
                            {pmData.map(d => (
                              <div key={d.name} className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: pmColors[d.name] ?? "#6366f1" }} />
                                <span className="text-sm text-slate-700 font-medium flex-1">{d.name}</span>
                                <span className="text-sm font-bold text-slate-500 tabular-nums">{formatCurrency(d.value, settings.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
