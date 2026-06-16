import React, { useState, useEffect } from "react";
import { Plus, Settings, Receipt, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, InventoryItem, BillItem } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'upi'|'card'|'credit'>('cash');
  
  const [shopSettings, setShopSettings] = useState(storage.getSettings());

  useEffect(() => {
    setInventory(storage.getInventory());
    setShopSettings(storage.getSettings());
  }, []);

  const handleAddToCart = () => {
    if (!selectedItem) {
      toast({ title: "Select an item first", variant: "destructive" });
      return;
    }
    const item = inventory.find(i => i.id === selectedItem);
    if (!item) return;
    
    const rate = item.sellingPrice;
    const amount = (rate * qty) * (1 - discount / 100);
    
    setCart([...cart, {
      productId: item.id,
      name: item.name,
      qty,
      rate,
      discount,
      amount
    }]);
    
    setSelectedItem("");
    setQty(1);
    setDiscount(0);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.amount, 0);
  const totalDiscount = cart.reduce((acc, item) => acc + ((item.rate * item.qty) - item.amount), 0);
  const gstAmount = gstEnabled ? subtotal * (gstRate / 100) : 0;
  const grandTotal = subtotal + gstAmount;

  const handleFinalize = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    
    storage.addBill({
      customerName: customerName || undefined,
      items: cart,
      subtotal,
      discount: totalDiscount,
      gstEnabled,
      gstRate,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: grandTotal,
      paymentMethod,
      status: paymentMethod === 'credit' ? 'credit' : 'paid',
      shopSettings
    });

    if (paymentMethod === 'credit' && customerName) {
      // Basic khata logic
      let customer = storage.getCustomers().find(c => c.phone === customerPhone);
      if (!customer) {
        customer = storage.addCustomer({ name: customerName, phone: customerPhone, address: "" });
      }
      storage.addTransaction({
        customerId: customer.id,
        type: 'udhaar',
        amount: grandTotal,
        note: `Bill`
      });
    }

    toast({ title: "Bill Finalized" });
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel: Entry */}
      <div className="w-1/3 glass-panel p-6 flex flex-col gap-6 no-print">
        <h2 className="text-2xl font-bold">New Bill</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Choose item..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.map(item => (
                  <SelectItem key={item.id} value={item.id}>{item.name} - ₹{item.sellingPrice}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Discount (%)</Label>
              <Input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
          </div>
          
          <Button className="w-full" onClick={handleAddToCart}>
            <Plus className="mr-2" size={16} /> Add to Bill
          </Button>
        </div>

        <hr className="border-border" />

        <div className="space-y-4 flex-1">
          <h3 className="font-semibold">Customer Details (Optional)</h3>
          <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <Input placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Payment Method</h3>
          <div className="flex gap-2">
            {['cash', 'upi', 'card', 'credit'].map((method) => (
              <Button 
                key={method}
                variant={paymentMethod === method ? 'default' : 'outline'}
                className="flex-1 capitalize"
                onClick={() => setPaymentMethod(method as any)}
              >
                {method}
              </Button>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full text-lg" onClick={handleFinalize}>
          Finalize Bill (₹{grandTotal.toFixed(2)})
        </Button>
      </div>

      {/* Right Panel: Invoice Preview */}
      <div className="flex-1 glass-panel p-8 overflow-auto print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="flex justify-between items-start mb-8 no-print">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Include GST</span>
            <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2" size={16} /> Print
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-8 bg-white/5 p-8 rounded-xl print:bg-transparent">
          <div className="text-center space-y-2 border-b border-white/10 pb-6 print:border-black/20">
            <h1 className="text-3xl font-bold text-primary print:text-black">{shopSettings.shopName}</h1>
            <p className="text-muted-foreground print:text-gray-600">{shopSettings.address} | {shopSettings.phone}</p>
            {gstEnabled && shopSettings.gstin && <p className="text-sm">GSTIN: {shopSettings.gstin}</p>}
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 print:border-black/20">
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Rate</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className="border-b border-white/5 print:border-black/10">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.qty}</td>
                  <td className="py-2">₹{item.rate}</td>
                  <td className="py-2 text-right">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">No items in bill</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {gstEnabled && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>CGST ({(gstRate/2)}%)</span>
                    <span>₹{(gstAmount/2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground border-b border-white/10 pb-2 print:border-black/20">
                    <span>SGST ({(gstRate/2)}%)</span>
                    <span>₹{(gstAmount/2).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xl font-bold text-primary print:text-black pt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground pt-8 print:text-gray-500">
            {shopSettings.thankYouMessage}
          </div>
        </div>
      </div>
    </div>
  );
}
