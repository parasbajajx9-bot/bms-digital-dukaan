import React, { useState, useEffect } from "react";
import {
  Download, TrendingUp, Wallet, CreditCard, AlertCircle, BarChart2, X, Activity,
  ChevronRight, FileText, Heart,
} from "lucide-react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { storage, Bill, Transaction, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

type Range = "today" | "week" | "month" | "30days" | "all";

function getStartDate(range: Range): Date | null {
  const now = new Date();
  if (range === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (range === "week")  { const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d; }
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
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  bills.forEach(b => {
    const key = fmt(b.createdAt);
    const ex = map.get(key) ?? { date: key, cash: 0, online: 0, credit: 0, total: 0 };
    if (b.paymentMethod === "cash") ex.cash += b.total;
    else if (["upi", "card"].includes(b.paymentMethod)) ex.online += b.total;
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

const TradingTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs backdrop-blur-sm min-w-[160px]">
      <p className="text-slate-400 font-semibold mb-2 pb-1.5 border-b border-slate-700/60 uppercase tracking-wider">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}
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

// ── Shared modal backdrop ─────────────────────────────────────────────────────
function ModalWrap({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-3 md:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const { settings } = useShopSettings();
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [range, setRange] = useState<Range>("month");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<"inventory" | "customers">("inventory");
  const [inventory, setInventory] = useState(storage.getInventory());
  const [healthOpen, setHealthOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);

  useEffect(() => {
    setBills(storage.getBills());
    setInventory(storage.getInventory());
    setTransactions(storage.getTransactions());
    const handler = () => setInventory(storage.getInventory());
    window.addEventListener("inventory-updated", handler);
    return () => window.removeEventListener("inventory-updated", handler);
  }, []);

  const startDate = getStartDate(range);
  const filtered = (startDate ? bills.filter(b => new Date(b.createdAt) >= startDate) : bills)
    .filter(b => b.status !== "cancelled");

  const totalRevenue = filtered.reduce((acc, b) => acc + b.total, 0);
  const cashSales   = filtered.filter(b => b.paymentMethod === "cash").reduce((acc, b) => acc + b.total, 0);
  const upiSales    = filtered.filter(b => ["upi","card"].includes(b.paymentMethod)).reduce((acc, b) => acc + b.total, 0);
  const creditGiven = filtered.filter(b => b.paymentMethod === "credit").reduce((acc, b) => acc + b.total, 0);

  const totalCgst  = filtered.reduce((acc, b) => acc + b.cgst, 0);
  const totalSgst  = filtered.reduce((acc, b) => acc + b.sgst, 0);
  const totalIgst  = filtered.reduce((acc, b) => acc + b.igst, 0);
  const totalGst   = totalCgst + totalSgst + totalIgst;
  const taxableSales = filtered.filter(b => b.gstEnabled).reduce((acc, b) => acc + b.subtotal, 0);

  const chartData  = buildChartData(filtered);
  const avgRevenue = chartData.length > 0 ? chartData.reduce((s, d) => s + d.total, 0) / chartData.length : 0;

  // Financial Health
  const inventoryMap = new Map(inventory.map(i => [i.id, i]));
  const totalCost  = filtered.reduce((acc, bill) =>
    acc + bill.items.reduce((s, item) => {
      const inv = item.productId ? inventoryMap.get(item.productId) : null;
      return s + (inv ? inv.costPrice * item.qty : 0);
    }, 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const marginPct   = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const overhead    = settings.monthlyOverhead ?? 0;
  const bep         = overhead > 0 && marginPct > 0 ? overhead / (marginPct / 100) : null;

  // Outstanding Udhaar — uses Khata transactions (range-filtered) so direct entries are included
  const rangedTxns = startDate
    ? transactions.filter(t => new Date(t.date) >= startDate)
    : transactions;
  const directUdhaarInRange = rangedTxns.filter(t => t.type === "udhaar").reduce((s, t) => s + t.amount, 0);
  const directPaymentsInRange = rangedTxns.filter(t => t.type === "payment").reduce((s, t) => s + t.amount, 0);
  // All-time outstanding balance (for the Financial Health card)
  const customers = storage.getCustomers();
  const outstandingUdhaar = customers.reduce((acc, c) => {
    const bal = transactions.filter(t => t.customerId === c.id)
      .reduce((s, t) => (t.type === "udhaar" ? s + t.amount : s - t.amount), 0);
    return acc + Math.max(0, bal);
  }, 0);

  const inventoryChartData = [...inventory]
    .sort((a, b) => b.stock - a.stock).slice(0, 12)
    .map(item => ({ name: item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name, stock: item.stock, lowAlert: item.lowStockThreshold }));

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
    const headers = ["Bill#","Date","Customer","Items","Subtotal","Discount","GST Enabled","GST Rate%","CGST","SGST","IGST","Total GST","Grand Total","Payment Method","Status"];
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

  // ── JSX helpers for reused modal content ──────────────────────────────────
  const FinancialHealthCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: "Total Revenue", value: formatCurrency(totalRevenue, settings.currency), color: "text-primary", bg: "bg-primary/8", note: `${filtered.length} bills` },
        { label: "Total Cost", value: formatCurrency(totalCost, settings.currency), color: "text-orange-600", bg: "bg-orange-50", note: "Wholesale cost" },
        { label: "Gross Profit", value: formatCurrency(grossProfit, settings.currency), color: grossProfit >= 0 ? "text-emerald-600" : "text-red-500", bg: grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50", note: grossProfit >= 0 ? "Net addition" : "Net loss" },
        { label: "Profit Margin", value: `${marginPct.toFixed(1)}%`, color: marginPct >= 20 ? "text-emerald-600" : marginPct >= 10 ? "text-amber-600" : "text-red-500", bg: "bg-slate-50", note: "Avg margin" },
        {
          label: "Break-Even Point",
          value: bep ? formatCurrency(bep, settings.currency) : overhead ? "Calc…" : "Set overhead",
          color: "text-violet-600", bg: "bg-violet-50",
          note: bep ? "Monthly target" : overhead ? "Need sales data" : "Shop Settings ↗",
        },
        {
          label: "Outstanding Udhaar",
          value: formatCurrency(outstandingUdhaar, settings.currency),
          color: outstandingUdhaar > 0 ? "text-red-600" : "text-emerald-600",
          bg: outstandingUdhaar > 0 ? "bg-red-50" : "bg-emerald-50",
          note: outstandingUdhaar > 0 ? "Pending recovery" : "All clear ✓",
        },
      ].map(card => (
        <div key={card.label} className={`rounded-2xl p-3.5 border border-slate-100 ${card.bg}`}>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{card.label}</p>
          <p className={`text-lg font-extrabold leading-tight ${card.color}`}>{card.value}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{card.note}</p>
        </div>
      ))}
    </div>
  );

  const RevenueChart = () => (
    chartData.length < 2 ? (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
        <BarChart2 size={36} className="text-slate-300" />
        <p className="text-sm font-medium">Not enough data for this period</p>
        <p className="text-xs text-slate-300">Finalize more bills to see trends</p>
      </div>
    ) : (
      <div className="bg-slate-950/[0.03] rounded-2xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCash2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillOnline2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillCredit2" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotoneX" dataKey="cash" name="Cash" stroke="#6366f1" strokeWidth={2} fill="url(#fillCash2)" dot={false} activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
            <Area type="monotoneX" dataKey="online" name="Online (UPI/Card)" stroke="#06b6d4" strokeWidth={2} fill="url(#fillOnline2)" dot={false} activeDot={{ r: 4, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }} />
            <Area type="monotoneX" dataKey="credit" name="Credit" stroke="#ef4444" strokeWidth={1.5} fill="url(#fillCredit2)" strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
            <Line type="monotoneX" dataKey="total" name="Total Revenue" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  );

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
      <div className="hidden md:flex gap-2 flex-wrap flex-shrink-0">
        {(Object.keys(rangeLabels) as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${range === r ? "bg-primary text-white border-primary shadow-sm" : "bg-white/80 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}>
            {rangeLabels[r]}
          </button>
        ))}
      </div>
      <div className="md:hidden flex-shrink-0">
        <select value={range} onChange={e => setRange(e.target.value as Range)}
          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
          {(Object.keys(rangeLabels) as Range[]).map(r => <option key={r} value={r}>{rangeLabels[r]}</option>)}
        </select>
      </div>

      {/* Top 4 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-shrink-0">
        {[
          { label: "Net Revenue",     value: formatCurrency(totalRevenue, settings.currency), sub: `${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`, color: "text-primary",    Icon: TrendingUp,   bg: "bg-primary/8"  },
          { label: "Cash Sales",      value: formatCurrency(cashSales,    settings.currency), sub: `${filtered.filter(b => b.paymentMethod === "cash").length} bills`,                        color: "text-green-700",  Icon: Wallet,      bg: "bg-green-50" },
          { label: "UPI / Card",      value: formatCurrency(upiSales,     settings.currency), sub: `${filtered.filter(b => ["upi","card"].includes(b.paymentMethod)).length} bills`,          color: "text-blue-700",   Icon: CreditCard,  bg: "bg-blue-50"  },
          {
            label: "Credit (Udhaar)",
            value: formatCurrency(directUdhaarInRange, settings.currency),
            sub: `${rangedTxns.filter(t => t.type === "udhaar").length} entries · Khata+Billing`,
            color: "text-red-600", Icon: AlertCircle, bg: "bg-red-50",
          },
        ].map(card => (
          <div key={card.label} className="glass-panel p-3 md:p-5">
            <div className={`inline-flex p-1.5 md:p-2 rounded-lg ${card.bg} mb-2 md:mb-3`}><card.Icon size={15} className={card.color} /></div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-base md:text-2xl font-extrabold mt-0.5 md:mt-1 leading-tight ${card.color}`}>{card.value}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── 3 Quick-View Action Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
        {[
          { label: "Financial Health",    sub: "Profit · Cost · BEP · Udhaar",    Icon: Heart,     color: "text-emerald-600", bg: "bg-emerald-50",  onClick: () => setHealthOpen(true)  },
          { label: "Revenue Performance", sub: `Daily trends · ${rangeLabels[range]}`, Icon: BarChart2, color: "text-primary",     bg: "bg-primary/8",   onClick: () => setRevenueOpen(true) },
          { label: "Sales History",       sub: `${filtered.length} transactions`,  Icon: FileText,  color: "text-violet-600",  bg: "bg-violet-50",   onClick: () => setSalesOpen(true)   },
        ].map(card => (
          <button key={card.label} onClick={card.onClick}
            className="glass-panel p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/20 transition-all group text-left w-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
              <card.Icon size={18} className={card.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm leading-tight">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{card.sub}</p>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* GST Summary (always visible, compact) */}
      <div className="glass-panel p-5 flex-shrink-0">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">GST Summary</h3>
          <p className="text-xs text-slate-400 mt-0.5">{rangeLabels[range]}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Taxable Sales", value: taxableSales, color: "text-slate-800" },
            { label: "Total CGST",    value: totalCgst,    color: "text-indigo-600" },
            { label: "Total SGST",    value: totalSgst,    color: "text-violet-600" },
            { label: "Total IGST",    value: totalIgst,    color: "text-orange-500" },
          ].map(row => (
            <div key={row.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{row.label}</p>
              <p className={`text-base font-extrabold mt-1 ${row.color}`}>{formatCurrency(row.value, settings.currency)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/60">
          <span className="text-sm font-bold text-slate-700">Total GST</span>
          <span className="text-base font-extrabold text-primary">{formatCurrency(totalGst, settings.currency)}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Use "Export CSV" to download bill-level data for GST filing.</p>
      </div>

      {/* ── MODAL: Financial Health ──────────────────────────────────────── */}
      {healthOpen && (
        <ModalWrap onClose={() => setHealthOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[95vw] md:max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Heart size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">Financial Health</h2>
                  <p className="text-xs text-slate-400">Revenue · Cost · Profit · BEP · {rangeLabels[range]}</p>
                </div>
              </div>
              <button onClick={() => setHealthOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-auto p-4 md:p-5">
              {!overhead && (
                <p className="text-xs text-slate-400 italic mb-4">Set monthly overhead in Shop Settings to enable BEP calculation ↗</p>
              )}
              <FinancialHealthCards />
            </div>
          </div>
        </ModalWrap>
      )}

      {/* ── MODAL: Revenue Performance ──────────────────────────────────── */}
      {revenueOpen && (
        <ModalWrap onClose={() => setRevenueOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[95vw] md:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart2 size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">Revenue Performance</h2>
                  <p className="text-xs text-slate-400">
                    Cash · UPI/Card · Credit — {rangeLabels[range]}
                    {avgRevenue > 0 && <span className="ml-2 font-semibold text-slate-600">Avg/day: {formatCurrency(avgRevenue, settings.currency)}</span>}
                  </p>
                </div>
              </div>
              <button onClick={() => setRevenueOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-auto p-4 md:p-5">
              <RevenueChart />
            </div>
          </div>
        </ModalWrap>
      )}

      {/* ── MODAL: Sales History ─────────────────────────────────────────── */}
      {salesOpen && (
        <ModalWrap onClose={() => setSalesOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[95vw] md:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <FileText size={16} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">Sales History</h2>
                  <p className="text-xs text-slate-400">{filtered.length} transactions · {rangeLabels[range]}</p>
                </div>
              </div>
              <button onClick={() => setSalesOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="overflow-auto p-4 md:p-5">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
                  <tr className="border-b border-slate-200">
                    {["Bill#","Date","Customer","Items","Payment","Total"].map(h => (
                      <th key={h} className={`py-2.5 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide ${h === "Total" ? "text-right" : h === "Items" || h === "Payment" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No bills for this period</td></tr>
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
        </ModalWrap>
      )}

      {/* ── MODAL: Graph Analytics ────────────────────────────────────────── */}
      {analyticsOpen && (
        <ModalWrap onClose={() => setAnalyticsOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[92vw] md:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm md:text-base font-extrabold text-slate-800 leading-none">Graph Analytics</h2>
                  <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Inventory & customer performance data</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                <div className="flex gap-0.5 bg-slate-100 rounded-lg p-1">
                  {(["inventory","customers"] as const).map(tab => (
                    <button key={tab} onClick={() => setAnalyticsTab(tab)}
                      className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${analyticsTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAnalyticsOpen(false)} className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-slate-100 transition-colors border border-slate-200">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
              {analyticsTab === "inventory" && (
                <>
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
                      <div className="bg-slate-950/[0.025] rounded-2xl border border-slate-100 p-4">
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={inventoryChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
                            <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" vertical={false} strokeOpacity={0.7} />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
                                  <p className="text-slate-300 font-semibold mb-2">{label}</p>
                                  <p className="text-white">Stock: <strong className="text-emerald-400">{payload[0]?.value} units</strong></p>
                                  {payload[1] && <p className="text-slate-400">Alert below: <strong className="text-amber-400">{payload[1]?.value}</strong></p>}
                                </div>
                              );
                            }} cursor={{ fill: "#6366f1", fillOpacity: 0.05 }} />
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

                  {(() => {
                    const catMap = new Map<string, number>();
                    inventory.forEach(item => catMap.set(item.category, (catMap.get(item.category) ?? 0) + item.stock));
                    const catData = [...catMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
                    if (!catData.length) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Category Stock Distribution</h3>
                        <p className="text-xs text-slate-400 mb-4">Units held per category</p>
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
                          <div className="w-full max-w-[220px] flex-shrink-0">
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                  {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {catData.map((d, i) => (
                              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                {d.name} <span className="text-slate-400 font-medium">({d.value})</span>
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
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Top Customer Spend</h3>
                  <p className="text-xs text-slate-400 mb-4">Total bill value per customer (all time)</p>
                  {customerChartData.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No customer data yet</div>
                  ) : (
                    <div className="bg-slate-950/[0.025] rounded-2xl border border-slate-100 p-4">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={customerChartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" horizontal={false} strokeOpacity={0.7} />
                          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip formatter={v => formatCurrency(Number(v), settings.currency)} contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "12px", fontSize: "12px", color: "#e2e8f0" }} />
                          <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={22}>
                            {customerChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalWrap>
      )}

    </div>
  );
}
