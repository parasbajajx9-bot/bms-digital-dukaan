import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage, Bill } from "@/lib/storage";

export default function ReportsPage() {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    setBills(storage.getBills());
  }, []);

  const totalRevenue = bills.reduce((acc, b) => acc + b.total, 0);
  const cashSales = bills.filter(b => b.paymentMethod === 'cash').reduce((acc, b) => acc + b.total, 0);
  const upiSales = bills.filter(b => ['upi', 'card'].includes(b.paymentMethod)).reduce((acc, b) => acc + b.total, 0);
  const creditGiven = bills.filter(b => b.paymentMethod === 'credit').reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Bookkeeping</h1>
        <Button variant="outline" className="gap-2"><Download size={16} /> Export Tax CSV</Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Total Net Revenue</div>
          <div className="text-3xl font-bold text-primary">₹{totalRevenue.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Cash Sales</div>
          <div className="text-3xl font-bold">₹{cashSales.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">UPI/Card Sales</div>
          <div className="text-3xl font-bold">₹{upiSales.toFixed(2)}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Credit (Udhaar)</div>
          <div className="text-3xl font-bold text-destructive">₹{creditGiven.toFixed(2)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel flex-1 p-6 flex flex-col">
        <h3 className="text-lg font-semibold mb-6">Recent Sales</h3>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="py-3 font-medium">Bill #</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Customer</th>
                <th className="py-3 font-medium">Items</th>
                <th className="py-3 font-medium">Payment</th>
                <th className="py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id} className="border-b border-white/5">
                  <td className="py-3 font-medium text-primary">{bill.billNumber}</td>
                  <td className="py-3 text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">{bill.customerName || '-'}</td>
                  <td className="py-3">{bill.items.length} items</td>
                  <td className="py-3 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.paymentMethod === 'credit' ? 'bg-destructive/20 text-destructive' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {bill.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold">₹{bill.total.toFixed(2)}</td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No bills recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
