import React, { useState, useEffect, useRef } from "react";
import { Plus, Printer, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, InventoryItem, BillItem } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

export default function BillingPage() {
  const { settings } = useShopSettings();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("");

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "credit">("cash");

  useEffect(() => {
    setInventory(storage.getInventory());
    setPreviewInvoiceNo(storage.peekNextInvoiceNumber());
    const handler = () => setInventory(storage.getInventory());
    window.addEventListener("inventory-updated", handler);
    return () => window.removeEventListener("inventory-updated", handler);
  }, []);

  const handleAddToCart = () => {
    if (!selectedItemId) { toast.error("Please select an item first."); return; }
    if (qty <= 0) { toast.error("Quantity must be at least 1."); return; }
    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) return;

    const rate = item.sellingPrice;
    const grossAmount = rate * qty;
    const discountAmount = grossAmount * (itemDiscount / 100);
    const amount = grossAmount - discountAmount;

    const existingIndex = cart.findIndex((c) => c.productId === item.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const existing = updated[existingIndex];
      const newQty = existing.qty + qty;
      const newDiscount = itemDiscount > 0 ? itemDiscount : existing.discount;
      updated[existingIndex] = {
        ...existing,
        qty: newQty,
        discount: newDiscount,
        amount: existing.rate * newQty * (1 - newDiscount / 100),
      };
      setCart(updated);
    } else {
      setCart((prev) => [
        ...prev,
        { productId: item.id, name: item.name, hsnCode: item.hsnCode, qty, rate, discount: itemDiscount, amount },
      ]);
    }

    setSelectedItemId("");
    setQty(1);
    setItemDiscount(0);
    toast.success(`${item.name} added to bill.`);
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: newQty, amount: item.rate * newQty * (1 - item.discount / 100) }
          : item
      )
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.amount, 0);
  const totalDiscountGiven = cart.reduce((acc, item) => acc + item.rate * item.qty * (item.discount / 100), 0);
  const halfGst = gstEnabled ? gstRate / 2 : 0;
  const cgst = gstEnabled ? subtotal * (halfGst / 100) : 0;
  const sgst = cgst;
  const grandTotal = subtotal + cgst + sgst;

  // True when any cart item has an HSN code and GST is on
  const showHsnCol = gstEnabled && cart.some((i) => i.hsnCode);
  const hasDiscount = cart.some((i) => i.discount > 0);

  const handleFinalize = () => {
    if (cart.length === 0) { toast.error("The bill is empty. Add at least one item."); return; }

    const bill = storage.addBill({
      customerName: customerName || undefined,
      items: cart,
      subtotal,
      discount: totalDiscountGiven,
      gstEnabled,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: grandTotal,
      paymentMethod,
      status: paymentMethod === "credit" ? "credit" : "paid",
      shopSettings: settings,
    });

    if (paymentMethod === "credit" && customerName) {
      let customer = storage.getCustomers().find((c) => c.phone === customerPhone && customerPhone !== "");
      if (!customer) customer = storage.addCustomer({ name: customerName, phone: customerPhone, address: "" });
      storage.addTransaction({
        customerId: customer.id,
        type: "udhaar",
        amount: grandTotal,
        note: `Bill ${bill.billNumber}`,
        billId: bill.id,
      });
      toast.success(`Bill saved. ₹${grandTotal.toFixed(2)} logged to ${customerName}'s Khata.`);
    } else {
      toast.success(`${bill.billNumber} finalised successfully.`);
    }

    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setGstEnabled(false);
    setPaymentMethod("cash");
    // Refresh preview number for the next bill
    setPreviewInvoiceNo(storage.peekNextInvoiceNumber());
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!customerPhone) { toast.error("Enter customer phone number to share on WhatsApp."); return; }
    const itemLines = cart.map((i) => `  ${i.name} x${i.qty} = ₹${i.amount.toFixed(2)}`).join("\n");
    const message =
      `*${settings.shopName}*\n${settings.address}\nTel: ${settings.phone}\n` +
      (gstEnabled && settings.gstin ? `GSTIN: ${settings.gstin}\n` : "") +
      `\n*Invoice: ${previewInvoiceNo}*\nDate: ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `${itemLines}\n\nSubtotal: ₹${subtotal.toFixed(2)}\n` +
      (gstEnabled ? `CGST (${halfGst}%): ₹${cgst.toFixed(2)}\nSGST (${halfGst}%): ₹${sgst.toFixed(2)}\n` : "") +
      `*Total: ₹${grandTotal.toFixed(2)}*\n\n${settings.thankYouMessage}`;
    window.open(`https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const paymentLabels: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", credit: "Credit (Udhaar)" };

  return (
    <div className="flex gap-5 h-full">
      {/* ── Left Panel ── */}
      <div className="w-[340px] flex-shrink-0 glass-panel p-5 flex flex-col gap-4 no-print overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800">New Bill</h2>

        {/* Item picker */}
        <div className="space-y-3 border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Select Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger data-testid="select-item" className="bg-white">
                <SelectValue placeholder="Choose from inventory..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.length === 0 && <SelectItem value="_empty" disabled>No inventory items</SelectItem>}
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-slate-500 ml-2">₹{item.sellingPrice}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-slate-700 text-sm">Qty</Label>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="bg-white" data-testid="input-qty" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-slate-700 text-sm">Discount %</Label>
              <Input type="number" min="0" max="100" value={itemDiscount} onChange={(e) => setItemDiscount(Number(e.target.value))} className="bg-white" data-testid="input-discount" />
            </div>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={handleAddToCart} data-testid="btn-add-to-bill">
            <Plus size={16} className="mr-2" /> Add to Bill
          </Button>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cart ({cart.length} items)</p>
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/80 border border-slate-200/60 rounded-lg px-3 py-2" data-testid={`cart-item-${idx}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">₹{item.rate} × {item.qty}{item.hsnCode ? ` · HSN ${item.hsnCode}` : ""}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateCartQty(idx, item.qty - 1)} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold">−</button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-800">{item.qty}</span>
                  <button onClick={() => updateCartQty(idx, item.qty + 1)} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold">+</button>
                </div>
                <span className="text-sm font-bold text-slate-800 w-20 text-right">₹{item.amount.toFixed(2)}</span>
                <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-1" data-testid={`btn-remove-item-${idx}`}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <hr className="border-slate-200/60" />

        {/* Customer */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Customer (Optional)</p>
          <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-white" data-testid="input-customer-name" />
          <Input placeholder="Phone number (for WhatsApp / Credit)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-white" data-testid="input-customer-phone" />
        </div>

        {/* GST toggle */}
        <div className="flex items-center justify-between bg-slate-50/60 border border-slate-200/50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Include GST</p>
            <p className="text-xs text-slate-500">Generates formal Tax Invoice</p>
          </div>
          <div className="flex items-center gap-3">
            {gstEnabled && (
              <Select value={String(gstRate)} onValueChange={(v) => setGstRate(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 5, 12, 18, 28].map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} data-testid="switch-gst" />
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "upi", "card", "credit"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all duration-150 ${paymentMethod === method ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}
                data-testid={`btn-payment-${method}`}
              >
                {paymentLabels[method]}
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-md mt-auto" onClick={handleFinalize} disabled={cart.length === 0} data-testid="btn-finalize-bill">
          Finalize Bill — ₹{grandTotal.toFixed(2)}
        </Button>
      </div>

      {/* ── Right Panel: Invoice Preview ── */}
      <div className="flex-1 glass-panel p-6 flex flex-col overflow-auto">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-5 no-print">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              {gstEnabled ? "Tax Invoice Preview" : "Receipt Preview"}
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-mono">{previewInvoiceNo}</span>
            {gstEnabled && (
              <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-semibold">GST Invoice</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50" data-testid="btn-whatsapp-share">
              <Share2 size={14} /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5" data-testid="btn-print">
              <Printer size={14} /> Print / PDF
            </Button>
          </div>
        </div>

        {/* ─────────── Printable Invoice ─────────── */}
        <div ref={invoiceRef} className="flex-1 bg-white rounded-xl border border-slate-200/60 p-8 print:p-6 print:border-0 print:rounded-none">

          {/* Header */}
          <div className="text-center pb-5 mb-5 border-b-2 border-slate-800">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{settings.shopName}</h1>
            <p className="text-slate-600 text-sm mt-1">{settings.address}</p>
            <p className="text-slate-600 text-sm">Tel: {settings.phone}</p>
            {gstEnabled && settings.gstin && (
              <p className="text-sm font-bold text-slate-800 mt-1.5 border border-slate-300 inline-block px-3 py-0.5 rounded-full bg-slate-50">
                GSTIN: {settings.gstin}
              </p>
            )}
          </div>

          {/* Invoice type label */}
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">
                {gstEnabled ? "Tax Invoice" : "Receipt"}
              </p>
              {customerName && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Billed To</p>
                  <p className="font-semibold text-slate-800">{customerName}</p>
                  {customerPhone && <p className="text-sm text-slate-500">{customerPhone}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <table className="text-sm ml-auto">
                <tbody>
                  <tr>
                    <td className="text-slate-500 pr-3 py-0.5">Invoice No.</td>
                    <td className="font-bold text-slate-900 font-mono">{previewInvoiceNo}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 pr-3 py-0.5">Date</td>
                    <td className="font-semibold text-slate-700">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 pr-3 py-0.5">Payment</td>
                    <td className="font-semibold text-slate-700 capitalize">{paymentLabels[paymentMethod]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-5 border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-800 bg-slate-50">
                <th className="text-left py-2 px-2 font-bold text-slate-700">#</th>
                <th className="text-left py-2 px-2 font-bold text-slate-700">Item Description</th>
                {showHsnCol && <th className="text-center py-2 px-2 font-bold text-slate-700 w-20">HSN</th>}
                <th className="text-center py-2 px-2 font-bold text-slate-700 w-12">Qty</th>
                <th className="text-right py-2 px-2 font-bold text-slate-700 w-24">Rate (₹)</th>
                {hasDiscount && <th className="text-right py-2 px-2 font-bold text-slate-700 w-16">Disc%</th>}
                <th className="text-right py-2 px-2 font-bold text-slate-700 w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                    No items added yet — select items from the left panel
                  </td>
                </tr>
              ) : (
                cart.map((item, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="py-2.5 px-2 text-slate-500">{i + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-800">{item.name}</td>
                    {showHsnCol && (
                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-xs">
                        {item.hsnCode || "—"}
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-center text-slate-600">{item.qty}</td>
                    <td className="py-2.5 px-2 text-right text-slate-600">{item.rate.toFixed(2)}</td>
                    {hasDiscount && (
                      <td className="py-2.5 px-2 text-right text-slate-500 text-xs">
                        {item.discount > 0 ? `${item.discount}%` : "—"}
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{item.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-0">
              <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscountGiven > 0 && (
                <div className="flex justify-between text-sm text-green-600 py-1.5 border-b border-slate-100">
                  <span>Discount</span>
                  <span>−₹{totalDiscountGiven.toFixed(2)}</span>
                </div>
              )}

              {/* ── GST rows: only when toggle ON ── */}
              {gstEnabled && (
                <>
                  <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                    <span>Taxable Amount</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                    <span>CGST @ {halfGst}%</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                    <span>SGST @ {halfGst}%</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 py-1 border-b border-slate-100">
                    <span>Total Tax ({gstRate}%)</span>
                    <span>₹{(cgst + sgst).toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 mt-1 border-t-2 border-slate-800">
                <span>TOTAL</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
              {paymentMethod === "credit" && (
                <div className="flex justify-between text-xs text-red-600 font-semibold pt-1">
                  <span>Status</span>
                  <span>Credit / Udhaar</span>
                </div>
              )}
            </div>
          </div>

          {/* Rupees in words (GST invoices) */}
          {gstEnabled && grandTotal > 0 && (
            <div className="mt-4 border border-slate-200 rounded-lg px-4 py-2 bg-slate-50/60">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Amount in Words: </span>
                <span className="italic">{numberToWords(grandTotal)} Rupees Only</span>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-500 text-sm">{settings.thankYouMessage}</p>
                {settings.termsConditions && <p className="text-slate-400 text-xs mt-0.5">{settings.termsConditions}</p>}
                {gstEnabled && (
                  <p className="text-xs text-slate-400 mt-1">
                    This is a computer-generated invoice. No signature required.
                  </p>
                )}
              </div>
              {gstEnabled && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-6">Authorised Signatory</p>
                  <p className="text-sm font-semibold text-slate-700 border-t border-slate-400 pt-1 pr-2 pl-8">{settings.shopName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal number-to-words helper (units up to crores, enough for any invoice)
function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
    if (num < 100000) return convert(Math.floor(num / 1000)) + "Thousand " + convert(num % 1000);
    if (num < 10000000) return convert(Math.floor(num / 100000)) + "Lakh " + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + "Crore " + convert(num % 10000000);
  }

  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = convert(rupees).trim();
  if (paise > 0) result += ` and ${convert(paise).trim()} Paise`;
  return result;
}
