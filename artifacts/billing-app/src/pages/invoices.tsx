import React, { useState, useEffect } from "react";
import { Search, FileText, Eye, Printer, X, ChevronDown, ChevronUp, Ban, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { storage, Bill, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

type SortField = "date" | "billNumber" | "total";
type SortDir = "asc" | "desc";

const PM_STYLE: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-700 border-emerald-200",
  upi: "bg-blue-100 text-blue-700 border-blue-200",
  card: "bg-violet-100 text-violet-700 border-violet-200",
  credit: "bg-red-100 text-red-600 border-red-200",
};
const PM_LABEL: Record<string, string> = {
  cash: "Cash", upi: "UPI", card: "Card", credit: "Udhaar",
};

export default function InvoicesPage() {
  const { settings } = useShopSettings();
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");
  const [filterPM, setFilterPM] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Bill | null>(null);

  const reload = () => setBills(storage.getBills());
  useEffect(() => { reload(); }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    const ok = storage.cancelBill(cancelTarget.id);
    if (ok) {
      toast.success(`${cancelTarget.billNumber} cancelled. Stock restored.`);
    } else {
      toast.error("Could not cancel this invoice.");
    }
    reload();
    // If the detail modal was open for this bill, close it
    if (selectedBill?.id === cancelTarget.id) setSelectedBill(null);
    setCancelTarget(null);
  };

  const filtered = bills
    .filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.billNumber.toLowerCase().includes(q) || (b.customerName ?? "").toLowerCase().includes(q);
      const matchPM = !filterPM || b.paymentMethod === filterPM;
      const matchStatus = !filterStatus || b.status === filterStatus;
      return matchSearch && matchPM && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === "total") cmp = a.total - b.total;
      else cmp = a.billNumber.localeCompare(b.billNumber);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const activeBills = bills.filter(b => b.status !== "cancelled");
  const totalRevenue = activeBills.reduce((s, b) => s + b.total, 0);
  const pendingCredit = activeBills.filter(b => b.status === "credit").reduce((s, b) => s + b.total, 0);
  const paidCount = activeBills.filter(b => b.status === "paid").length;
  const cancelledCount = bills.filter(b => b.status === "cancelled").length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  };

  const statusBadge = (status: Bill["status"]) => {
    if (status === "cancelled")
      return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200 line-through">Cancelled</span>;
    if (status === "paid")
      return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">Paid</span>;
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">Credit</span>;
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Active Revenue", value: formatCurrency(totalRevenue, settings.currency), sub: `${activeBills.length} active bills`, color: "text-primary" },
          { label: "Paid Bills", value: paidCount.toString(), sub: "Settled", color: "text-emerald-600" },
          { label: "Credit Pending", value: formatCurrency(pendingCredit, settings.currency), sub: `${activeBills.filter(b => b.status === "credit").length} bills`, color: "text-red-600" },
          { label: "Cancelled", value: cancelledCount.toString(), sub: "Stock restored", color: "text-slate-500" },
        ].map(s => (
          <div key={s.label} className="glass-panel p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="glass-panel flex-1 flex flex-col min-h-0 p-5">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input className="pl-9 bg-white h-9 text-sm" placeholder="Search bill # or customer…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterPM} onChange={e => setFilterPM(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Credit / Udhaar</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="credit">Credit</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(search || filterPM || filterStatus) && (
            <button onClick={() => { setSearch(""); setFilterPM(""); setFilterStatus(""); }}
              className="h-9 px-3 rounded-lg text-sm text-slate-500 hover:text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <X size={13} /> Clear
            </button>
          )}
          <p className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <tr className="border-b-2 border-slate-100">
                {[
                  { label: "Invoice #", field: "billNumber" as SortField, align: "left" },
                  { label: "Date & Time", field: "date" as SortField, align: "left" },
                  { label: "Customer", field: null, align: "left" },
                  { label: "Items", field: null, align: "center" },
                  { label: "Payment", field: null, align: "center" },
                  { label: "Status", field: null, align: "center" },
                  { label: "Total", field: "total" as SortField, align: "right" },
                  { label: "Actions", field: null, align: "right" },
                ].map(({ label, field, align }) => (
                  <th key={label}
                    className={`py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide text-${align} ${field ? "cursor-pointer select-none hover:text-primary transition-colors" : ""}`}
                    onClick={field ? () => toggleSort(field) : undefined}>
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FileText size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium">No invoices match your filters</p>
                    <p className="text-slate-300 text-xs mt-1">Try adjusting your search or filters above</p>
                  </td>
                </tr>
              ) : filtered.map(bill => {
                const isCancelled = bill.status === "cancelled";
                return (
                  <tr key={bill.id}
                    className={`border-b border-slate-50 transition-colors ${isCancelled ? "bg-slate-50/60 opacity-60" : "hover:bg-slate-50/70 cursor-pointer group"}`}
                    onClick={!isCancelled ? () => setSelectedBill(bill) : undefined}>
                    <td className="py-3.5 px-3">
                      <span className={`font-bold font-mono text-xs px-2 py-1 rounded-md border ${isCancelled ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-primary/8 text-primary border-primary/15"}`}>
                        {bill.billNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <p className="font-medium text-slate-800">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-slate-400">{new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      {bill.customerName
                        ? <span className="font-medium text-slate-800">{bill.customerName}</span>
                        : <span className="text-slate-400 italic text-xs">Walk-in Customer</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                        {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PM_STYLE[bill.paymentMethod] ?? "bg-slate-100 text-slate-600"}`}>
                        {PM_LABEL[bill.paymentMethod] ?? bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">{statusBadge(bill.status)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`font-extrabold ${isCancelled ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {formatCurrency(bill.total, settings.currency)}
                      </span>
                      {bill.discount > 0 && !isCancelled && (
                        <p className="text-xs text-green-600">−{formatCurrency(bill.discount, settings.currency)} disc</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/8"
                            title="View receipt"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {!isCancelled && (
                          <button
                            onClick={() => setCancelTarget(bill)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Cancel invoice"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        {isCancelled && (
                          <span className="text-xs text-slate-400 italic pr-1">Voided</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedBill(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-sm">{selectedBill.billNumber}</span>
                {statusBadge(selectedBill.status)}
              </div>
              <div className="flex items-center gap-2">
                {selectedBill.status !== "cancelled" && (
                  <button
                    onClick={() => { setCancelTarget(selectedBill); setSelectedBill(null); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Ban size={12} /> Cancel Invoice
                  </button>
                )}
                <button onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => setSelectedBill(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="text-center pb-4 mb-4 border-b border-dashed border-slate-200">
                <p className="text-lg font-extrabold text-slate-900">{selectedBill.shopSettings.shopName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedBill.shopSettings.address}</p>
                <p className="text-xs text-slate-500">Tel: {selectedBill.shopSettings.phone}</p>
                {selectedBill.gstEnabled && selectedBill.shopSettings.gstin && (
                  <p className="text-xs font-bold text-slate-700 mt-1">GSTIN: {selectedBill.shopSettings.gstin}</p>
                )}
              </div>

              <div className="flex justify-between mb-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Customer</p>
                  <p className="font-semibold text-slate-800">{selectedBill.customerName || "Walk-in Customer"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Date</p>
                  <p className="font-semibold text-slate-800">{new Date(selectedBill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="text-xs text-slate-400">{new Date(selectedBill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500">Item</th>
                      <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500">Qty</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500">Rate</th>
                      <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items.map((item, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.name}
                          {item.discount > 0 && <span className="ml-1 text-xs text-green-600">−{item.discount.toFixed(0)}%</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{item.qty}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{formatCurrency(item.rate, settings.currency)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{formatCurrency(item.amount, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span><span>{formatCurrency(selectedBill.subtotal, settings.currency)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>−{formatCurrency(selectedBill.discount, settings.currency)}</span>
                  </div>
                )}
                {selectedBill.gstEnabled && (
                  <>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>CGST ({selectedBill.gstRate / 2}%)</span><span>{formatCurrency(selectedBill.cgst, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>SGST ({selectedBill.gstRate / 2}%)</span><span>{formatCurrency(selectedBill.sgst, settings.currency)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-extrabold text-slate-900 text-base pt-2 border-t-2 border-slate-200 mt-2">
                  <span>TOTAL</span>
                  <span className="text-primary">{formatCurrency(selectedBill.total, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>Payment Mode</span>
                  <span className={`font-bold capitalize px-2 py-0.5 rounded-full border text-xs ${PM_STYLE[selectedBill.paymentMethod]}`}>
                    {PM_LABEL[selectedBill.paymentMethod]}
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-5 pt-4 border-t border-dashed border-slate-200">
                {selectedBill.shopSettings.thankYouMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog open={cancelTarget !== null} onOpenChange={open => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              Cancel Invoice?
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-slate-600 text-sm">
              You are about to cancel{" "}
              <strong className="text-slate-800">{cancelTarget?.billNumber}</strong>
              {cancelTarget?.customerName ? ` for ${cancelTarget.customerName}` : ""}{" "}
              worth <strong className="text-slate-800">{cancelTarget && formatCurrency(cancelTarget.total, settings.currency)}</strong>.
            </p>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-amber-700 text-xs font-semibold">What happens next</p>
              <ul className="text-amber-600 text-xs space-y-1 list-disc list-inside">
                <li>Invoice stays on record as <strong>Cancelled</strong></li>
                <li>Inventory stock is automatically restored</li>
                <li>Revenue excluded from Reports dashboard</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Invoice</Button>
            <Button variant="destructive" onClick={handleCancel} className="gap-1.5">
              <Ban size={14} /> Cancel Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
