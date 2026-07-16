import React, { useState, useEffect, useRef } from "react";
import { Plus, Printer, Share2, X, Percent, IndianRupee, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, InventoryItem, BillItem, formatCurrency, currencySymbol } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

export default function BillingPage() {
  const { settings } = useShopSettings();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const sym = currencySymbol(settings.currency);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string>("");

  // ── Searchable item selector ──
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemSearch, setItemSearch] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Qty as string so backspace clears properly ──
  const [qtyRaw, setQtyRaw] = useState<string>("1");

  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<"pct" | "flat">("pct");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "credit">("cash");

  // ── Mobile receipt modal ──
  const [mobileReceiptOpen, setMobileReceiptOpen] = useState(false);

  useEffect(() => {
    setInventory(storage.getInventory());
    setPreviewInvoiceNo(storage.peekNextInvoiceNumber());
    const handler = () => setInventory(storage.getInventory());
    window.addEventListener("inventory-updated", handler);
    return () => window.removeEventListener("inventory-updated", handler);
  }, []);

  // Close item dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);
  const filteredInventory = inventory.filter(
    (item) =>
      !itemSearch ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 30);

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setItemSearch(item.name);
    setDropdownOpen(false);
  };

  const handleAddToCart = () => {
    if (!selectedItemId) { toast.error("Please select an item first."); return; }
    const qtyNum = parseInt(qtyRaw) || 0;
    if (qtyNum <= 0) { toast.error("Quantity must be at least 1."); return; }
    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) return;

    const rate = item.sellingPrice;
    const grossAmount = rate * qtyNum;

    let discountPct = 0;
    if (discountMode === "pct") {
      discountPct = Math.min(100, Math.max(0, itemDiscount));
    } else {
      const flatCapped = Math.min(itemDiscount, grossAmount);
      discountPct = grossAmount > 0 ? (flatCapped / grossAmount) * 100 : 0;
    }

    const discountAmount = grossAmount * (discountPct / 100);
    const amount = grossAmount - discountAmount;

    const existingIndex = cart.findIndex((c) => c.productId === item.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const existing = updated[existingIndex];
      const newQty = existing.qty + qtyNum;
      const usedPct = discountPct > 0 ? discountPct : existing.discount;
      updated[existingIndex] = {
        ...existing, qty: newQty, discount: usedPct,
        amount: existing.rate * newQty * (1 - usedPct / 100),
      };
      setCart(updated);
    } else {
      setCart((prev) => [
        ...prev,
        { productId: item.id, name: item.name, hsnCode: item.hsnCode, qty: qtyNum, rate, discount: discountPct, amount },
      ]);
    }

    setSelectedItemId("");
    setItemSearch("");
    setQtyRaw("1");
    setItemDiscount(0);
    toast.success(`${item.name} added to bill.`);
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, qty: newQty, amount: item.rate * newQty * (1 - item.discount / 100) } : item
      )
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.amount, 0);
  const totalDiscountGiven = cart.reduce((acc, item) => acc + item.rate * item.qty * (item.discount / 100), 0);

  const gstApplicable = settings.globalGstEnabled && gstEnabled;
  const halfGst = gstApplicable ? gstRate / 2 : 0;
  const cgst = gstApplicable ? subtotal * (halfGst / 100) : 0;
  const sgst = cgst;
  const grandTotal = subtotal + cgst + sgst;

  const showHsnCol = gstApplicable && cart.some((i) => i.hsnCode);
  const hasDiscount = cart.some((i) => i.discount > 0);

  const paymentLabels: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", credit: "Credit (Udhaar)" };

  const handleFinalize = () => {
    if (cart.length === 0) { toast.error("The bill is empty. Add at least one item."); return; }

    const bill = storage.addBill({
      customerName: customerName || undefined,
      items: cart, subtotal, discount: totalDiscountGiven,
      gstEnabled: gstApplicable, gstRate, cgst, sgst, igst: 0,
      total: grandTotal, paymentMethod,
      status: paymentMethod === "credit" ? "credit" : "paid",
      shopSettings: settings,
    });

    storage.deductInventoryStock(cart);

    if (paymentMethod === "credit" && customerName) {
      let customer = storage.getCustomers().find((c) => c.phone === customerPhone && customerPhone !== "");
      if (!customer) customer = storage.addCustomer({ name: customerName, phone: customerPhone, address: "" });
      storage.addTransaction({
        customerId: customer.id, type: "udhaar", amount: grandTotal,
        note: `Bill ${bill.billNumber}`, billId: bill.id,
      });
      toast.success(`Bill saved. ${formatCurrency(grandTotal, settings.currency)} logged to ${customerName}'s Khata.`);
    } else {
      toast.success(`${bill.billNumber} finalised successfully.`);
    }

    setCart([]); setCustomerName(""); setCustomerPhone("");
    setGstEnabled(false); setPaymentMethod("cash");
    setPreviewInvoiceNo(storage.peekNextInvoiceNumber());
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!customerPhone) { toast.error("Enter customer phone number to share on WhatsApp."); return; }
    const itemLines = cart.map((i) => `  ${i.name} x${i.qty} = ${formatCurrency(i.amount, settings.currency)}`).join("\n");
    const message =
      `*${settings.shopName}*\n${settings.address}\nTel: ${settings.phone}\n` +
      (gstApplicable && settings.gstin ? `GSTIN: ${settings.gstin}\n` : "") +
      `\n*Invoice: ${previewInvoiceNo}*\nDate: ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `${itemLines}\n\nSubtotal: ${formatCurrency(subtotal, settings.currency)}\n` +
      (gstApplicable ? `CGST (${halfGst}%): ${formatCurrency(cgst, settings.currency)}\nSGST (${halfGst}%): ${formatCurrency(sgst, settings.currency)}\n` : "") +
      `*Total: ${formatCurrency(grandTotal, settings.currency)}*\n\n${settings.thankYouMessage}`;
    window.open(`https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Shared receipt JSX — used in both desktop panel and mobile modal
  const ReceiptContent = () => (
    <div ref={invoiceRef} className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 print:p-6 print:border-0 print:rounded-none">
      <div className="text-center pb-5 mb-5 border-b-2 border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{settings.shopName}</h1>
        <p className="text-slate-600 text-sm mt-1">{settings.address}</p>
        <p className="text-slate-600 text-sm">Tel: {settings.phone}</p>
        {gstApplicable && settings.gstin && (
          <p className="text-sm font-bold text-slate-800 mt-1.5 border border-slate-300 inline-block px-3 py-0.5 rounded-full bg-slate-50">
            GSTIN: {settings.gstin}
          </p>
        )}
      </div>

      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">
            {gstApplicable ? "Tax Invoice" : "Receipt"}
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
              <tr><td className="text-slate-500 pr-3 py-0.5">Invoice No.</td><td className="font-bold text-slate-900 font-mono">{previewInvoiceNo}</td></tr>
              <tr><td className="text-slate-500 pr-3 py-0.5">Date</td><td className="font-semibold text-slate-700">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td></tr>
              <tr><td className="text-slate-500 pr-3 py-0.5">Payment</td><td className="font-semibold text-slate-700 capitalize">{paymentLabels[paymentMethod]}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="w-full text-sm mb-5 border-collapse">
        <thead>
          <tr className="border-y-2 border-slate-800 bg-slate-50">
            <th className="text-left py-2 px-2 font-bold text-slate-700">#</th>
            <th className="text-left py-2 px-2 font-bold text-slate-700">Item Description</th>
            {showHsnCol && <th className="text-center py-2 px-2 font-bold text-slate-700 w-20">HSN</th>}
            <th className="text-center py-2 px-2 font-bold text-slate-700 w-12">Qty</th>
            <th className="text-right py-2 px-2 font-bold text-slate-700 w-24">Rate ({sym})</th>
            {hasDiscount && <th className="text-right py-2 px-2 font-bold text-slate-700 w-16">Disc%</th>}
            <th className="text-right py-2 px-2 font-bold text-slate-700 w-28">Amount ({sym})</th>
          </tr>
        </thead>
        <tbody>
          {cart.length === 0 ? (
            <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No items added yet</td></tr>
          ) : (
            cart.map((item, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-2.5 px-2 text-slate-500">{i + 1}</td>
                <td className="py-2.5 px-2 font-medium text-slate-800">{item.name}</td>
                {showHsnCol && <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-xs">{item.hsnCode || "—"}</td>}
                <td className="py-2.5 px-2 text-center text-slate-600">{item.qty}</td>
                <td className="py-2.5 px-2 text-right text-slate-600">{item.rate.toFixed(2)}</td>
                {hasDiscount && <td className="py-2.5 px-2 text-right text-slate-500 text-xs">{item.discount > 0 ? `${item.discount.toFixed(1)}%` : "—"}</td>}
                <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{item.amount.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-0">
          <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
            <span>Subtotal</span><span>{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          {totalDiscountGiven > 0 && (
            <div className="flex justify-between text-sm text-green-600 py-1.5 border-b border-slate-100">
              <span>Discount</span><span>−{formatCurrency(totalDiscountGiven, settings.currency)}</span>
            </div>
          )}
          {gstApplicable && (
            <>
              <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                <span>Taxable Amount</span><span>{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                <span>CGST @ {halfGst}%</span><span>{formatCurrency(cgst, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 py-1.5 border-b border-slate-100">
                <span>SGST @ {halfGst}%</span><span>{formatCurrency(sgst, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 py-1 border-b border-slate-100">
                <span>Total Tax ({gstRate}%)</span><span>{formatCurrency(cgst + sgst, settings.currency)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 mt-1 border-t-2 border-slate-800">
            <span>TOTAL</span><span className="text-primary">{formatCurrency(grandTotal, settings.currency)}</span>
          </div>
          {paymentMethod === "credit" && (
            <div className="flex justify-between text-xs text-red-600 font-semibold pt-1">
              <span>Status</span><span>Credit / Udhaar</span>
            </div>
          )}
        </div>
      </div>

      {gstApplicable && grandTotal > 0 && (
        <div className="mt-4 border border-slate-200 rounded-lg px-4 py-2 bg-slate-50/60">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Amount in Words: </span>
            <span className="italic">{numberToWords(grandTotal)} {settings.currency === 'USD' ? 'Dollars' : 'Rupees'} Only</span>
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-slate-500 text-sm">{settings.thankYouMessage}</p>
            {settings.termsConditions && <p className="text-slate-400 text-xs mt-0.5">{settings.termsConditions}</p>}
            {gstApplicable && <p className="text-xs text-slate-400 mt-1">This is a computer-generated invoice. No signature required.</p>}
          </div>
          {gstApplicable && (
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-6">Authorised Signatory</p>
              <p className="text-sm font-semibold text-slate-700 border-t border-slate-400 pt-1 pr-2 pl-8">{settings.shopName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-5 h-full overflow-hidden">

      {/* ── Left Panel: New Bill Form ── */}
      <div className="w-full md:w-[360px] md:flex-shrink-0 glass-panel p-5 flex flex-col gap-4 no-print overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800">New Bill</h2>

        {/* Item picker */}
        <div className="space-y-3 border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">

          {/* ── Searchable item selector ── */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Select Item</Label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="Search item by name or SKU…"
                  value={dropdownOpen ? itemSearch : (selectedItem ? selectedItem.name : itemSearch)}
                  onFocus={() => {
                    setDropdownOpen(true);
                    if (selectedItem) setItemSearch("");
                  }}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setSelectedItemId("");
                    setDropdownOpen(true);
                  }}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-auto">
                  {inventory.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">
                      No inventory yet — add products in Inventory first
                    </div>
                  ) : filteredInventory.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">No items found</div>
                  ) : (
                    filteredInventory.map((item) => (
                      <button
                        key={item.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/5 text-left border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-900 block truncate">{item.name}</span>
                          <span className="text-xs text-slate-400">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{formatCurrency(item.sellingPrice, settings.currency)}</span>
                          {item.stock === 0 && <span className="text-xs text-red-500 font-semibold">Out</span>}
                          {item.stock > 0 && item.stock <= item.lowStockThreshold && (
                            <span className="text-xs text-amber-500">Low ({item.stock})</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Qty */}
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-sm">Qty</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={qtyRaw}
              onChange={(e) => setQtyRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { if (!qtyRaw || parseInt(qtyRaw) < 1) setQtyRaw("1"); }}
              className="bg-white"
              placeholder="1"
            />
          </div>

          {/* Discount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 text-sm">Discount</Label>
              <button
                onClick={() => { setDiscountMode(m => m === "pct" ? "flat" : "pct"); setItemDiscount(0); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors bg-white border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary"
              >
                {discountMode === "pct"
                  ? <><Percent size={10} /><span>Percent</span></>
                  : <><IndianRupee size={10} /><span>Flat</span></>}
              </button>
            </div>
            <div className="relative">
              <Input
                type="number" min="0" max={discountMode === "pct" ? 100 : undefined}
                value={itemDiscount}
                onChange={(e) => setItemDiscount(Number(e.target.value))}
                className="bg-white pr-10"
                placeholder={discountMode === "pct" ? "0" : "0.00"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none select-none">
                {discountMode === "pct" ? "%" : sym}
              </span>
            </div>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={handleAddToCart}>
            <Plus size={16} className="mr-2" /> Add to Bill
          </Button>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cart ({cart.length} items)</p>
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/80 border border-slate-200/60 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(item.rate, settings.currency)} × {item.qty}
                    {item.discount > 0 && <span className="text-green-600 ml-1">−{item.discount.toFixed(1)}%</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateCartQty(idx, item.qty - 1)} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold">−</button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-800">{item.qty}</span>
                  <button onClick={() => updateCartQty(idx, item.qty + 1)} className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold">+</button>
                </div>
                <span className="text-sm font-bold text-slate-800 w-20 text-right">{formatCurrency(item.amount, settings.currency)}</span>
                <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-1"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <hr className="border-slate-200/60" />

        {/* Customer */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Customer (Optional)</p>
          <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-white" />
          <Input placeholder="Phone number (for WhatsApp / Credit)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-white" />
        </div>

        {/* GST toggle */}
        {settings.globalGstEnabled && (
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
              <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
            </div>
          </div>
        )}

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "upi", "card", "credit"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all duration-150 ${paymentMethod === method ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}
              >
                {paymentLabels[method]}
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-md" onClick={handleFinalize} disabled={cart.length === 0}>
          Finalize Bill — {formatCurrency(grandTotal, settings.currency)}
        </Button>

        {/* Mobile View Receipt button */}
        <button
          className="md:hidden flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-semibold text-sm transition-colors hover:bg-primary/10"
          onClick={() => setMobileReceiptOpen(true)}
        >
          <Eye size={16} /> View Receipt — {formatCurrency(grandTotal, settings.currency)}
        </button>
      </div>

      {/* ── Right Panel: Invoice Preview (desktop only) ── */}
      <div className="hidden md:flex flex-1 glass-panel p-6 flex-col overflow-auto min-w-0">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-5 no-print">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              {gstApplicable ? "Tax Invoice Preview" : "Receipt Preview"}
            </span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-mono">{previewInvoiceNo}</span>
            {gstApplicable && (
              <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-semibold">GST Invoice</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50">
              <Share2 size={14} /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer size={14} /> Print / PDF
            </Button>
          </div>
        </div>
        <ReceiptContent />
      </div>

      {/* ── Mobile Receipt Modal ── */}
      {mobileReceiptOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end md:hidden" onClick={() => setMobileReceiptOpen(false)}>
          <div
            className="bg-white rounded-t-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {gstApplicable ? "Tax Invoice" : "Receipt Preview"}
                </span>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{previewInvoiceNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold">
                  <Share2 size={12} /> WhatsApp
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold">
                  <Printer size={12} /> Print
                </button>
                <button onClick={() => setMobileReceiptOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Scrollable receipt */}
            <div className="overflow-auto p-4">
              <ReceiptContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
    if (num < 100000) return convert(Math.floor(num / 1000)) + "Thousand " + convert(num % 1000);
    if (num < 10000000) return convert(Math.floor(num / 100000)) + "Lakh " + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + "Crore " + convert(n % 10000000);
  }
  return convert(Math.floor(n)).trim();
}
