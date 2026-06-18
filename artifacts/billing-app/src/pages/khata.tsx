import React, { useState, useEffect } from "react";
import { Plus, Search, MessageCircle, UserPlus, TrendingUp, TrendingDown, Users, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { storage, Customer, Transaction, Bill, formatCurrency, SUSPENSE_CUSTOMER_ID } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

export default function KhataPage() {
  const { settings } = useShopSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [udhaarOpen, setUdhaarOpen] = useState(false);
  const [udhaarAmount, setUdhaarAmount] = useState("");
  const [udhaarNote, setUdhaarNote] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  const reload = () => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
    setBills(storage.getBills());
  };

  useEffect(() => { reload(); }, []);

  const getBalance = (customerId: string) =>
    transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => (t.type === "udhaar" ? acc + t.amount : acc - t.amount), 0);

  const handleAddCustomer = () => {
    if (!newName.trim()) { toast.error("Customer name is required."); return; }
    storage.addCustomer({ name: newName.trim(), phone: newPhone.trim(), address: newAddress.trim() });
    toast.success(`${newName} added to Khata.`);
    reload();
    setAddCustomerOpen(false);
    setNewName(""); setNewPhone(""); setNewAddress("");
  };

  const handleLogUdhaar = () => {
    if (!selectedCustomer) return;
    const amount = Number(udhaarAmount);
    if (!udhaarAmount || isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount."); return; }
    storage.addTransaction({ customerId: selectedCustomer.id, type: "udhaar", amount, note: udhaarNote.trim() || "Udhaar given" });
    toast.success(`${formatCurrency(amount, settings.currency)} Udhaar logged for ${selectedCustomer.name}.`);
    reload();
    setUdhaarOpen(false);
    setUdhaarAmount(""); setUdhaarNote("");
  };

  const handleRecordPayment = () => {
    if (!selectedCustomer) return;
    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount."); return; }
    storage.addTransaction({ customerId: selectedCustomer.id, type: "payment", amount, note: paymentNote.trim() || "Payment received" });
    toast.success(`${formatCurrency(amount, settings.currency)} payment recorded for ${selectedCustomer.name}.`);
    reload();
    setPaymentOpen(false);
    setPaymentAmount(""); setPaymentNote("");
  };

  const handleWhatsAppReminder = () => {
    if (!selectedCustomer) return;
    const balance = getBalance(selectedCustomer.id);
    if (balance <= 0) { toast.info("This customer has no outstanding balance."); return; }
    const msg =
      `Dear ${selectedCustomer.name},\n\n` +
      `This is a gentle reminder that you have an outstanding balance of *${formatCurrency(balance, settings.currency)}* at *${settings.shopName}*.\n\n` +
      `Kindly pay at your earliest convenience.\n` +
      `UPI: ${settings.phone}@upi\n\n` +
      `Thank you!\n— ${settings.shopName}`;
    window.open(`https://wa.me/91${selectedCustomer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDeleteCustomer = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    storage.deleteCustomer(deleteTarget.id);
    toast.success(`${name}'s profile removed. Transactions kept in records.`);
    if (selectedCustomer?.id === deleteTarget.id) setSelectedCustomer(null);
    setDeleteTarget(null);
    reload();
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const selectedTxns = selectedCustomer
    ? transactions
        .filter((t) => t.customerId === selectedCustomer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const selectedBalance = selectedCustomer ? getBalance(selectedCustomer.id) : 0;

  const totalOutstanding = customers.reduce((acc, c) => {
    const bal = getBalance(c.id);
    return bal > 0 ? acc + bal : acc;
  }, 0);

  const now = new Date();
  const collectedThisMonth = transactions
    .filter(t => {
      if (t.type !== "payment") return false;
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const customersWithBalance = customers.filter(c => getBalance(c.id) > 0).length;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── KPI Summary Bar ── */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-shrink-0">
        <div className="glass-panel px-3 py-3 md:px-6 md:py-4 flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={15} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">Total Credit Outstanding</p>
            <p className="text-base md:text-2xl font-extrabold text-red-600 leading-none">{formatCurrency(totalOutstanding, settings.currency)}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{customersWithBalance} pending</p>
          </div>
        </div>
        <div className="glass-panel px-3 py-3 md:px-6 md:py-4 flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={15} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5 truncate">Collected This Month</p>
            <p className="text-base md:text-2xl font-extrabold text-emerald-600 leading-none">{formatCurrency(collectedThisMonth, settings.currency)}</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{new Date().toLocaleString("en-IN", { month: "short", year: "numeric" })}</p>
          </div>
        </div>
      </div>

    <div className="flex flex-col md:flex-row gap-4 md:gap-5 flex-1 overflow-auto md:min-h-0">
      {/* ── Left: Customer List ── */}
      <div className="w-full md:w-72 md:flex-shrink-0 glass-panel p-4 flex flex-col gap-3 md:max-h-none max-h-64">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input placeholder="Search customers..." className="pl-8 bg-white text-sm h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0" onClick={() => setAddCustomerOpen(true)}>
            <UserPlus size={15} />
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-2 min-h-0">
          {filteredCustomers.length === 0 && (
            <div className="text-center py-10">
              <Users size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No customers yet</p>
              <button onClick={() => setAddCustomerOpen(true)} className="text-primary text-sm mt-1 hover:underline">Add first customer</button>
            </div>
          )}
          {filteredCustomers.map((c) => {
            const bal = getBalance(c.id);
            const isSelected = selectedCustomer?.id === c.id;
            return (
              <div
                key={c.id}
                className={`relative group rounded-xl border transition-all duration-150 ${isSelected ? "border-primary/40 bg-primary/8 shadow-sm" : "border-slate-200/60 bg-white/70 hover:bg-white hover:border-slate-300"}`}
              >
                <button className="w-full text-left p-3 pr-8" onClick={() => setSelectedCustomer(c)}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-800 truncate max-w-[110px]">{c.name}</span>
                    <span className={`text-sm font-bold ${bal > 0 ? "text-red-600" : bal < 0 ? "text-green-600" : "text-slate-400"}`}>
                      {bal > 0 ? `−${formatCurrency(bal, settings.currency)}` : bal < 0 ? `+${formatCurrency(Math.abs(bal), settings.currency)}` : "Settled"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.phone || "No phone"}</p>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                  className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                  title="Delete customer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Customer Detail ── */}
      <div className="flex-1 glass-panel p-6 flex flex-col min-h-0">
        {selectedCustomer ? (
          <>
            <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-800">{selectedCustomer.name}</h2>
                  <button onClick={() => setDeleteTarget(selectedCustomer)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete this customer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-slate-500 text-sm mt-0.5">{selectedCustomer.phone}</p>
                {selectedCustomer.address && <p className="text-slate-400 text-xs mt-0.5">{selectedCustomer.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Net Balance</p>
                <p className={`text-3xl font-extrabold ${selectedBalance > 0 ? "text-red-600" : selectedBalance < 0 ? "text-green-600" : "text-slate-400"}`}>
                  {selectedBalance > 0 ? `${formatCurrency(selectedBalance, settings.currency)} Due`
                    : selectedBalance < 0 ? `${formatCurrency(Math.abs(selectedBalance), settings.currency)} Advance`
                    : "Settled"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <Button className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={() => { setUdhaarAmount(""); setUdhaarNote(""); setUdhaarOpen(true); }}>
                <TrendingUp size={16} /> Log Udhaar
              </Button>
              <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={() => { setPaymentAmount(""); setPaymentNote(""); setPaymentOpen(true); }}>
                <TrendingDown size={16} /> Record Payment
              </Button>
              <Button variant="outline" className="gap-2 text-green-700 border-green-300 hover:bg-green-50" onClick={handleWhatsAppReminder}>
                <MessageCircle size={16} /> Remind
              </Button>
            </div>

            {/* Transaction history */}
            <div className="flex-1 overflow-auto min-h-0">
              {selectedTxns.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No transactions yet for this customer</div>
              ) : (
                <div className="space-y-2">
                  {selectedTxns.map((t) => {
                    const linkedBill = t.billId ? bills.find(b => b.id === t.billId) : null;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          t.type === "udhaar"
                            ? "bg-red-50/50 border-red-100"
                            : "bg-emerald-50/50 border-emerald-100"
                        }`}
                      >
                        {/* Type indicator */}
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "udhaar" ? "bg-red-100" : "bg-emerald-100"}`}>
                          {t.type === "udhaar"
                            ? <TrendingUp size={14} className="text-red-600" />
                            : <TrendingDown size={14} className="text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{t.note}</p>
                            {linkedBill && (
                              <button
                                onClick={() => setReceiptBill(linkedBill)}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/70 font-medium border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors"
                              >
                                <Receipt size={10} /> View Receipt
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {linkedBill && <span className="ml-2 font-mono">{linkedBill.billNumber}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${t.type === "udhaar" ? "text-red-600" : "text-emerald-600"}`}>
                            {t.type === "udhaar" ? "−" : "+"}{formatCurrency(t.amount, settings.currency)}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">{t.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Users size={40} className="text-slate-300" />
            <p className="text-base font-medium">Select a customer to view their Khata</p>
            <p className="text-sm">All transactions, balances, and history will appear here</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-slate-800">Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Full Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Phone Number</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="e.g. 9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Address (Optional)</Label>
              <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="e.g. 12 Gandhi Nagar" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary/90 text-white">Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Udhaar Modal */}
      <Dialog open={udhaarOpen} onOpenChange={setUdhaarOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-slate-800">Log Udhaar — {selectedCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Amount *</Label>
              <Input type="number" min="0" value={udhaarAmount} onChange={(e) => setUdhaarAmount(e.target.value)} placeholder="e.g. 500" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Note / Reason</Label>
              <Input value={udhaarNote} onChange={(e) => setUdhaarNote(e.target.value)} placeholder="e.g. Monthly grocery credit" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUdhaarOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleLogUdhaar}>Log Udhaar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-slate-800">Record Payment — {selectedCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {selectedBalance > 0 && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500 font-semibold">Outstanding Balance</p>
                <p className="text-xl font-extrabold text-red-600">{formatCurrency(selectedBalance, settings.currency)}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Amount Received *</Label>
              <Input type="number" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="e.g. 500" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Note / Payment Mode</Label>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Paid via UPI" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Modal */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-slate-800">Delete Customer?</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-slate-600 text-sm">
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>'s profile?
            </p>
            <div className="bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 space-y-1">
              <p className="text-amber-700 text-xs font-semibold">Sales data is preserved</p>
              <p className="text-amber-600 text-xs">
                Their billing history will be kept in Reports under <em>Unknown / Suspense Account</em> so your total revenue stays accurate.
                Only the personal profile and Khata entries are removed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>Delete Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini Receipt Modal */}
      <Dialog open={receiptBill !== null} onOpenChange={(open) => !open && setReceiptBill(null)}>
        <DialogContent className="sm:max-w-xs bg-white p-0 overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Bill Receipt</DialogTitle></DialogHeader>
          {receiptBill && <MiniReceipt bill={receiptBill} currency={settings.currency} />}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

// ─── Compact thermal-style mini receipt ───────────────────────────────────────
function MiniReceipt({ bill, currency }: { bill: Bill; currency: 'INR' | 'USD' }) {
  const shop = bill.shopSettings;
  return (
    <div className="font-mono text-xs bg-white p-5 select-text">
      {/* Shop header */}
      <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
        <p className="font-bold text-sm text-slate-900">{shop.shopName}</p>
        <p className="text-slate-500 text-[11px]">{shop.address}</p>
        <p className="text-slate-500 text-[11px]">Tel: {shop.phone}</p>
      </div>

      {/* Meta */}
      <div className="flex justify-between text-[11px] text-slate-600 mb-2">
        <span className="font-bold text-slate-800">{bill.billNumber}</span>
        <span>{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      {bill.customerName && (
        <p className="text-[11px] text-slate-500 mb-2">For: <span className="font-semibold text-slate-700">{bill.customerName}</span></p>
      )}

      {/* Items */}
      <div className="border-t border-dashed border-slate-300 pt-2 mb-2 space-y-1">
        {bill.items.map((item, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span className="text-slate-700 truncate flex-1">{item.name} ×{item.qty}</span>
            <span className="text-slate-800 font-semibold flex-shrink-0">{formatCurrency(item.amount, currency)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5">
        {bill.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span>−{formatCurrency(bill.discount, currency)}</span>
          </div>
        )}
        {bill.gstEnabled && (
          <>
            <div className="flex justify-between text-slate-600"><span>CGST</span><span>{formatCurrency(bill.cgst, currency)}</span></div>
            <div className="flex justify-between text-slate-600"><span>SGST</span><span>{formatCurrency(bill.sgst, currency)}</span></div>
          </>
        )}
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300 mt-1 text-sm">
          <span>TOTAL</span><span className="text-primary">{formatCurrency(bill.total, currency)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Payment</span>
          <span className={`capitalize font-semibold ${bill.status === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>
            {bill.paymentMethod === 'credit' ? 'Credit / Udhaar' : bill.paymentMethod.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-3 pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-400">
        {shop.thankYouMessage}
      </div>
    </div>
  );
}
