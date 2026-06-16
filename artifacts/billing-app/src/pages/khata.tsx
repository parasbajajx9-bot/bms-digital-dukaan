import React, { useState, useEffect } from "react";
import { Plus, Search, MessageCircle, UserPlus, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { storage, Customer, Transaction } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

export default function KhataPage() {
  const { settings } = useShopSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const reload = () => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
  };

  useEffect(() => {
    reload();
  }, []);

  const getBalance = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => (t.type === "udhaar" ? acc + t.amount : acc - t.amount), 0);
  };

  const handleAddCustomer = () => {
    if (!newName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    storage.addCustomer({ name: newName.trim(), phone: newPhone.trim(), address: newAddress.trim() });
    toast.success(`${newName} added to Khata.`);
    reload();
    setAddCustomerOpen(false);
    setNewName("");
    setNewPhone("");
    setNewAddress("");
  };

  const handleLogUdhaar = () => {
    if (!selectedCustomer) return;
    const amount = Number(udhaarAmount);
    if (!udhaarAmount || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    storage.addTransaction({
      customerId: selectedCustomer.id,
      type: "udhaar",
      amount,
      note: udhaarNote.trim() || "Udhaar given",
    });
    toast.success(`₹${amount} Udhaar logged for ${selectedCustomer.name}.`);
    reload();
    setUdhaarOpen(false);
    setUdhaarAmount("");
    setUdhaarNote("");
  };

  const handleRecordPayment = () => {
    if (!selectedCustomer) return;
    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    storage.addTransaction({
      customerId: selectedCustomer.id,
      type: "payment",
      amount,
      note: paymentNote.trim() || "Payment received",
    });
    toast.success(`₹${amount} payment recorded for ${selectedCustomer.name}.`);
    reload();
    setPaymentOpen(false);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handleWhatsAppReminder = () => {
    if (!selectedCustomer) return;
    const balance = getBalance(selectedCustomer.id);
    if (balance <= 0) {
      toast.info("This customer has no outstanding balance.");
      return;
    }
    const msg =
      `Dear ${selectedCustomer.name},\n\n` +
      `This is a gentle reminder that you have an outstanding balance of *₹${balance.toFixed(2)}* at *${settings.shopName}*.\n\n` +
      `Kindly pay at your earliest convenience.\n` +
      `UPI: ${settings.phone}@upi\n\n` +
      `Thank you!\n— ${settings.shopName}`;
    const phone = selectedCustomer.phone.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
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

  return (
    <div className="flex gap-5 h-full">
      {/* ── Left: Customer List ── */}
      <div className="w-72 flex-shrink-0 glass-panel p-4 flex flex-col gap-3">
        {/* Summary */}
        <div className="bg-red-50/70 border border-red-200/60 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Total Outstanding</p>
          <p className="text-2xl font-extrabold text-red-600">₹{totalOutstanding.toFixed(2)}</p>
          <p className="text-xs text-red-400">{customers.length} customers</p>
        </div>

        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Search customers..."
              className="pl-8 bg-white text-sm h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-khata-search"
            />
          </div>
          <Button
            size="icon"
            className="h-9 w-9 bg-primary hover:bg-primary/90 flex-shrink-0"
            onClick={() => setAddCustomerOpen(true)}
            data-testid="btn-add-customer"
          >
            <UserPlus size={15} />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto space-y-2 min-h-0">
          {filteredCustomers.length === 0 && (
            <div className="text-center py-10">
              <Users size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No customers yet</p>
              <button
                onClick={() => setAddCustomerOpen(true)}
                className="text-primary text-sm mt-1 hover:underline"
              >
                Add first customer
              </button>
            </div>
          )}
          {filteredCustomers.map((c) => {
            const bal = getBalance(c.id);
            const isSelected = selectedCustomer?.id === c.id;
            return (
              <button
                key={c.id}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? "border-primary/40 bg-primary/8 shadow-sm"
                    : "border-slate-200/60 bg-white/70 hover:bg-white hover:border-slate-300"
                }`}
                onClick={() => setSelectedCustomer(c)}
                data-testid={`customer-card-${c.id}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-slate-800 truncate max-w-[120px]">{c.name}</span>
                  <span
                    className={`text-sm font-bold ${
                      bal > 0 ? "text-red-600" : bal < 0 ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {bal > 0 ? `−₹${bal.toFixed(2)}` : bal < 0 ? `+₹${Math.abs(bal).toFixed(2)}` : "Settled"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{c.phone || "No phone"}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Customer Detail ── */}
      <div className="flex-1 glass-panel p-6 flex flex-col min-h-0">
        {selectedCustomer ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-200/60">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">{selectedCustomer.name}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{selectedCustomer.phone}</p>
                {selectedCustomer.address && (
                  <p className="text-slate-400 text-xs mt-0.5">{selectedCustomer.address}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Net Balance</p>
                <p
                  className={`text-3xl font-extrabold ${
                    selectedBalance > 0
                      ? "text-red-600"
                      : selectedBalance < 0
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  {selectedBalance > 0
                    ? `₹${selectedBalance.toFixed(2)} Due`
                    : selectedBalance < 0
                    ? `₹${Math.abs(selectedBalance).toFixed(2)} Advance`
                    : "Settled"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-5">
              <Button
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => { setUdhaarAmount(""); setUdhaarNote(""); setUdhaarOpen(true); }}
                data-testid="btn-log-udhaar"
              >
                <TrendingUp size={16} /> Log Udhaar
              </Button>
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={() => { setPaymentAmount(""); setPaymentNote(""); setPaymentOpen(true); }}
                data-testid="btn-record-payment"
              >
                <TrendingDown size={16} /> Record Payment
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-green-700 border-green-300 hover:bg-green-50"
                onClick={handleWhatsAppReminder}
                data-testid="btn-whatsapp-reminder"
              >
                <MessageCircle size={16} /> Remind
              </Button>
            </div>

            {/* Transaction history */}
            <div className="flex-1 overflow-auto min-h-0">
              {selectedTxns.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No transactions yet for this customer
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur-sm">
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3 font-semibold text-slate-600">Date</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-600">Details</th>
                      <th className="text-right py-3 px-3 font-semibold text-red-500">Given (Udhaar)</th>
                      <th className="text-right py-3 px-3 font-semibold text-green-600">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTxns.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        data-testid={`txn-row-${t.id}`}
                      >
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{t.note}</td>
                        <td className="py-3 px-3 text-right font-semibold text-red-600">
                          {t.type === "udhaar" ? `₹${t.amount.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-green-600">
                          {t.type === "payment" ? `₹${t.amount.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <DialogHeader>
            <DialogTitle className="text-slate-800">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Full Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                data-testid="input-new-customer-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Phone Number</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                data-testid="input-new-customer-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Address (Optional)</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. 12 Gandhi Nagar"
                data-testid="input-new-customer-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddCustomer}
              className="bg-primary hover:bg-primary/90 text-white"
              data-testid="btn-save-customer"
            >
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Udhaar Modal */}
      <Dialog open={udhaarOpen} onOpenChange={setUdhaarOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              Log Udhaar — {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Amount (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={udhaarAmount}
                onChange={(e) => setUdhaarAmount(e.target.value)}
                placeholder="e.g. 500"
                data-testid="input-udhaar-amount"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Note / Reason</Label>
              <Input
                value={udhaarNote}
                onChange={(e) => setUdhaarNote(e.target.value)}
                placeholder="e.g. Monthly grocery credit"
                data-testid="input-udhaar-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUdhaarOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogUdhaar}
              data-testid="btn-save-udhaar"
            >
              Log Udhaar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              Record Payment — {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedBalance > 0 && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500 font-semibold">Outstanding Balance</p>
                <p className="text-xl font-extrabold text-red-600">₹{selectedBalance.toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Amount Received (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 500"
                data-testid="input-payment-amount"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Note / Payment Mode</Label>
              <Input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Paid via UPI"
                data-testid="input-payment-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleRecordPayment}
              data-testid="btn-save-payment"
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
