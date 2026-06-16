import React, { useState, useEffect } from "react";
import { Plus, Search, Minus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage, InventoryItem } from "@/lib/storage";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setItems(storage.getInventory());
  }, []);

  const adjustStock = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    storage.updateInventoryItem(id, { stock: newStock });
    setItems(storage.getInventory());
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

  const totalValue = items.reduce((acc, item) => acc + (item.costPrice * item.stock), 0);
  const lowStockCount = items.filter(i => i.stock <= i.lowStockThreshold && i.stock > 0).length;
  const outOfStockCount = items.filter(i => i.stock === 0).length;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Total Products</div>
          <div className="text-3xl font-bold">{items.length}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Low Stock</div>
          <div className="text-3xl font-bold text-amber-400">{lowStockCount}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Out of Stock</div>
          <div className="text-3xl font-bold text-destructive">{outOfStockCount}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="text-muted-foreground mb-2">Inventory Value</div>
          <div className="text-3xl font-bold text-primary">₹{totalValue.toFixed(2)}</div>
        </div>
      </div>

      <div className="glass-panel flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search products or SKU..." 
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2"><Plus size={16} /> Add Product</Button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="py-3 font-medium">Product Name</th>
                <th className="py-3 font-medium">SKU</th>
                <th className="py-3 font-medium">Category</th>
                <th className="py-3 font-medium">Price</th>
                <th className="py-3 font-medium">Stock</th>
                <th className="py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3 text-muted-foreground">{item.sku}</td>
                  <td className="py-3">{item.category}</td>
                  <td className="py-3">
                    ₹{item.sellingPrice} <span className="text-xs text-muted-foreground">(Cost: ₹{item.costPrice})</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustStock(item.id, -1)}><Minus size={12} /></Button>
                      <span className={`w-8 text-center font-bold ${item.stock === 0 ? 'text-destructive' : item.stock <= item.lowStockThreshold ? 'text-amber-400' : ''}`}>
                        {item.stock}
                      </span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustStock(item.id, 1)}><Plus size={12} /></Button>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
