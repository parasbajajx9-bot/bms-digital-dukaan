import React, { useState, useEffect } from "react";
import { Plus, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage, Customer, Transaction } from "@/lib/storage";

export default function KhataPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
  }, []);

  const getBalance = (customerId: string) => {
    const txns = transactions.filter(t => t.customerId === customerId);
    return txns.reduce((acc, t) => {
      if (t.type === 'udhaar') return acc + t.amount;
      return acc - t.amount;
    }, 0);
  };

  const handleAddTransaction = (type: 'udhaar'|'payment', amount: number, note: string) => {
    if (!selectedCustomer) return;
    storage.addTransaction({
      customerId: selectedCustomer.id,
      type,
      amount,
      note
    });
    setTransactions(storage.getTransactions());
  };

  const selectedTxns = selectedCustomer ? transactions.filter(t => t.customerId === selectedCustomer.id) : [];
  const selectedBalance = selectedCustomer ? getBalance(selectedCustomer.id) : 0;

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel */}
      <div className="w-1/3 glass-panel p-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <Input placeholder="Search customers..." className="flex-1" />
          <Button size="icon"><Plus size={16} /></Button>
        </div>
        
        <div className="flex-1 overflow-auto space-y-2">
          {customers.map(c => {
            const bal = getBalance(c.id);
            return (
              <div 
                key={c.id} 
                className={`p-4 rounded-xl cursor-pointer border ${selectedCustomer?.id === c.id ? 'border-primary bg-primary/10' : 'border-border bg-white/5 hover:bg-white/10'}`}
                onClick={() => setSelectedCustomer(c)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{c.name}</span>
                  <span className={`font-bold ${bal > 0 ? 'text-destructive' : 'text-emerald-400'}`}>
                    ₹{Math.abs(bal).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{c.phone}</div>
              </div>
            );
          })}
          {customers.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No customers yet</div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 glass-panel p-8 flex flex-col">
        {selectedCustomer ? (
          <>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold">{selectedCustomer.name}</h2>
                <p className="text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Net Balance</div>
                <div className={`text-4xl font-bold ${selectedBalance > 0 ? 'text-destructive' : 'text-emerald-400'}`}>
                  {selectedBalance > 0 ? 'Due ' : 'Advance '}
                  ₹{Math.abs(selectedBalance).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={() => handleAddTransaction('udhaar', 500, 'Given udhaar')}>
                + Log New Udhaar
              </Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleAddTransaction('payment', 500, 'Received payment')}>
                - Record Payment
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageCircle size={16} /> Send Reminder
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Details</th>
                    <th className="py-3 text-right font-medium">Given (Udhaar)</th>
                    <th className="py-3 text-right font-medium">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTxns.map(t => (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="py-3">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3">{t.note}</td>
                      <td className="py-3 text-right text-destructive">
                        {t.type === 'udhaar' ? `₹${t.amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 text-right text-emerald-400">
                        {t.type === 'payment' ? `₹${t.amount.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {selectedTxns.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a customer from the list to view their Khata
          </div>
        )}
      </div>
    </div>
  );
}
