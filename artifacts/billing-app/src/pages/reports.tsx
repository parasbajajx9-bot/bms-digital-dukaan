import React, { useState, useEffect } from "react";
import { Download, TrendingUp, Wallet, CreditCard, AlertCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage, Bill } from "@/lib/storage";
import { toast } from "sonner";

type Range = "today" | "week" | "month" | "30days" | "all";

function getStartDate(range: Range): Date | null {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (range === "30days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

const rangeLabels: Record<Range, string> = {
  today: "Today",
  week: "Last 7 Days",
  month: "This Month",
  "30days": "Last 30 Days",
  all: "All Time",
};

export default function ReportsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [range, setRange] = useState<Range>("month");

  useEffect(() => {
    setBills(storage.getBills());
  }, []);

  const startDate = getStartDate(range);
  const filtered = startDate
    ? bills.filter((b) => new Date(b.createdAt) >= startDate)
    : bills;

  const totalRevenue = filtered.reduce((acc, b) => acc + b.total, 0);
  const cashSales = filtered
    .filter((b) => b.paymentMethod === "cash")
    .reduce((acc, b) => acc + b.total, 0);
  const upiSales = filtered
    .filter((b) => b.paymentMethod === "upi" || b.paymentMethod === "card")
    .reduce((acc, b) => acc + b.total, 0);
  const creditGiven = filtered
    .filter((b) => b.paymentMethod === "credit")
    .reduce((acc, b) => acc + b.total, 0);

  const totalCgst = filtered.reduce((acc, b) => acc + b.cgst, 0);
  const totalSgst = filtered.reduce((acc, b) => acc + b.sgst, 0);
  const totalIgst = filtered.reduce((acc, b) => acc + b.igst, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const taxableSales = filtered
    .filter((b) => b.gstEnabled)
    .reduce((acc, b) => acc + b.subtotal, 0);

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export for the selected period.");
      return;
    }
    const headers = [
      "Bill#",
      "Date",
      "Customer",
      "Items",
      "Subtotal",
      "Discount",
      "GST Enabled",
      "GST Rate%",
      "CGST",
      "SGST",
      "IGST",
      "Total GST",
      "Grand Total",
      "Payment Method",
      "Status",
    ];
    const rows = filtered.map((b) => [
      b.billNumber,
      new Date(b.createdAt).toLocaleDateString("en-IN"),
      b.customerName || "",
      b.items.length,
      b.subtotal.toFixed(2),
      b.discount.toFixed(2),
      b.gstEnabled ? "Yes" : "No",
      b.gstEnabled ? b.gstRate : 0,
      b.cgst.toFixed(2),
      b.sgst.toFixed(2),
      b.igst.toFixed(2),
      (b.cgst + b.sgst + b.igst).toFixed(2),
      b.total.toFixed(2),
      b.paymentMethod,
      b.status,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${rangeLabels[range].replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tax report downloaded successfully.");
  };

  const paymentMethodColor: Record<string, string> = {
    cash: "bg-green-100 text-green-700",
    upi: "bg-blue-100 text-blue-700",
    card: "bg-violet-100 text-violet-700",
    credit: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Reports & Bookkeeping</h1>
          <p className="text-slate-500 text-sm mt-0.5">Financial overview for {rangeLabels[range].toLowerCase()}</p>
        </div>
        <Button
          onClick={exportCSV}
          className="gap-2 bg-primary hover:bg-primary/90 text-white"
          data-testid="btn-export-csv"
        >
          <Download size={15} /> Export Tax CSV
        </Button>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(rangeLabels) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
              range === r
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white/80 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
            }`}
            data-testid={`btn-range-${r}`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Net Revenue",
            value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${filtered.length} bill${filtered.length !== 1 ? "s" : ""}`,
            color: "text-primary",
            icon: TrendingUp,
            bg: "bg-primary/8",
          },
          {
            label: "Cash Sales",
            value: `₹${cashSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${filtered.filter((b) => b.paymentMethod === "cash").length} bills`,
            color: "text-green-700",
            icon: Wallet,
            bg: "bg-green-50",
          },
          {
            label: "UPI / Card",
            value: `₹${upiSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${filtered.filter((b) => ["upi", "card"].includes(b.paymentMethod)).length} bills`,
            color: "text-blue-700",
            icon: CreditCard,
            bg: "bg-blue-50",
          },
          {
            label: "Credit (Udhaar)",
            value: `₹${creditGiven.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${filtered.filter((b) => b.paymentMethod === "credit").length} bills`,
            color: "text-red-600",
            icon: AlertCircle,
            bg: "bg-red-50",
          },
        ].map((card) => (
          <div key={card.label} className={`glass-panel p-5`}>
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Bills table */}
        <div className="col-span-2 glass-panel p-5 flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Sales History</h3>
          <div className="flex-1 overflow-auto min-h-0">
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
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <BarChart2 size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400 text-sm">No bills for this period</p>
                    </td>
                  </tr>
                ) : (
                  [...filtered]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((bill) => (
                      <tr
                        key={bill.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        data-testid={`report-row-${bill.id}`}
                      >
                        <td className="py-2.5 px-3 font-bold text-primary">{bill.billNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{bill.customerName || "—"}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{bill.items.length}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                              paymentMethodColor[bill.paymentMethod] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {bill.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          ₹{bill.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Summary */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">GST Summary</h3>
          <p className="text-xs text-slate-400 -mt-2">For {rangeLabels[range].toLowerCase()}</p>

          <div className="space-y-3">
            {[
              { label: "Taxable Sales", value: taxableSales, color: "text-slate-800" },
              { label: "Total CGST", value: totalCgst, color: "text-blue-600" },
              { label: "Total SGST", value: totalSgst, color: "text-violet-600" },
              { label: "Total IGST", value: totalIgst, color: "text-orange-500" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-sm text-slate-600">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>₹{row.value.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold text-slate-700">Total GST Collected</span>
              <span className="text-base font-extrabold text-primary">₹{totalGst.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-200/60">
            <p className="text-xs text-slate-400 leading-relaxed">
              Use "Export Tax CSV" to download a full bill-level breakdown for GST filing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
