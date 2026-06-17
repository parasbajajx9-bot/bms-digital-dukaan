import React, { useState, useEffect } from "react";
import { Plus, Search, Minus, Edit, Trash2, Package, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { storage, InventoryItem, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

type ProductForm = {
  name: string; sku: string; hsnCode: string; category: string;
  sellingPrice: string; costPrice: string; stock: string; lowStockThreshold: string;
};

const emptyForm: ProductForm = {
  name: "", sku: "", hsnCode: "", category: "",
  sellingPrice: "", costPrice: "", stock: "", lowStockThreshold: "5",
};

export default function InventoryPage() {
  const { settings, saveSettings } = useShopSettings();

  const toggleGst = () => {
    const next = !settings.globalGstEnabled;
    saveSettings({ ...settings, globalGstEnabled: next });
    toast.success(next ? "GST features enabled — HSN codes & tax fields are now active." : "GST features disabled — HSN codes hidden for simpler billing.");
  };
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<ProductForm>>({});
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const reload = () => {
    setItems(storage.getInventory());
    window.dispatchEvent(new Event("inventory-updated"));
  };

  useEffect(() => { reload(); }, []);

  const adjustStock = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    storage.updateInventoryItem(id, { stock: Math.max(0, item.stock + delta) });
    reload();
  };

  const openAddModal = () => { setForm(emptyForm); setFormErrors({}); setEditingId(null); setModalMode("add"); };
  const openEditModal = (item: InventoryItem) => {
    setForm({
      name: item.name, sku: item.sku, hsnCode: item.hsnCode ?? "", category: item.category,
      sellingPrice: String(item.sellingPrice), costPrice: String(item.costPrice),
      stock: String(item.stock), lowStockThreshold: String(item.lowStockThreshold),
    });
    setFormErrors({}); setEditingId(item.id); setModalMode("edit");
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProductForm> = {};
    if (!form.name.trim()) errors.name = "Product name is required";
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0)
      errors.sellingPrice = "Valid selling price required";
    if (!form.costPrice || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
      errors.costPrice = "Valid cost price required";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errors.stock = "Valid stock count required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const data = {
      name: form.name.trim(),
      sku: form.sku.trim() || `SKU-${Date.now()}`,
      hsnCode: form.hsnCode.trim() || undefined,
      category: form.category.trim() || "General",
      sellingPrice: Number(form.sellingPrice),
      costPrice: Number(form.costPrice),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
    };
    if (modalMode === "add") {
      storage.addInventoryItem(data);
      toast.success(`${data.name} added to inventory.`);
    } else if (modalMode === "edit" && editingId) {
      storage.updateInventoryItem(editingId, data);
      toast.success(`${data.name} updated.`);
    }
    reload();
    setModalMode(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    storage.deleteInventoryItem(deleteTarget.id);
    toast.success(`${deleteTarget.name} removed from inventory.`);
    reload();
    setDeleteTarget(null);
  };

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalValue = items.reduce((acc, i) => acc + i.costPrice * i.stock, 0);
  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const outOfStockCount = items.filter((i) => i.stock === 0).length;

  const sym = settings.currency === 'USD' ? '$' : '₹';

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Stats + GST Quick Toggle */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Products", value: items.length, color: "text-slate-800" },
          { label: "Low Stock", value: lowStockCount, color: "text-amber-600" },
          { label: "Out of Stock", value: outOfStockCount, color: "text-red-600" },
          { label: "Inventory Value", value: formatCurrency(totalValue, settings.currency), color: "text-primary font-bold" },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}

        {/* GST Quick Toggle — 5th card */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggleGst}
          onKeyDown={e => e.key === "Enter" && toggleGst()}
          className={`glass-panel p-5 text-left transition-all duration-200 hover:shadow-md cursor-pointer select-none ${settings.globalGstEnabled ? "border-primary/30 bg-primary/5" : "border-slate-200/60"}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${settings.globalGstEnabled ? "bg-primary/15" : "bg-slate-100"}`}>
              <Zap size={15} className={settings.globalGstEnabled ? "text-primary" : "text-slate-400"} />
            </div>
            <Switch checked={settings.globalGstEnabled} onCheckedChange={toggleGst} onClick={e => e.stopPropagation()} />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">GST Features</p>
          <p className={`text-lg font-extrabold ${settings.globalGstEnabled ? "text-primary" : "text-slate-400"}`}>
            {settings.globalGstEnabled ? "Enabled" : "Disabled"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-tight">
            {settings.globalGstEnabled ? "HSN & tax fields active" : "Tap to enable tax billing"}
          </p>
        </div>
      </div>

      {/* Main table */}
      <div className="glass-panel flex-1 p-5 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input placeholder="Search product name or SKU..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {categories.length > 0 && (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={openAddModal}>
            <Plus size={15} /> Add Product
          </Button>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden flex-1 overflow-auto space-y-3 min-h-0">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No products found</p>
            </div>
          )}
          {filtered.map((item) => {
            const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;
            const isOut = item.stock === 0;
            return (
              <div key={item.id} className={`rounded-xl border px-4 py-3.5 transition-colors ${isOut ? "bg-red-50/60 border-red-200/60" : isLow ? "bg-amber-50/60 border-amber-200/60" : "bg-white/70 border-slate-200/60"}`}>
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                      {isOut && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Out</span>}
                      {isLow && !isOut && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Low</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.sku}{item.category ? ` · ${item.category}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    <span>Sell <strong className="text-slate-800">{sym}{item.sellingPrice}</strong></span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span>Cost <span className="text-slate-500">{sym}{item.costPrice}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustStock(item.id, -1)} className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-600 transition-colors font-bold"><Minus size={12} /></button>
                    <span className={`w-7 text-center font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"}`}>{item.stock}</span>
                    <button onClick={() => adjustStock(item.id, 1)} className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-green-50 hover:border-green-200 hover:text-green-600 flex items-center justify-center text-slate-600 transition-colors font-bold"><Plus size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200">
                <th className="py-3 px-3 font-semibold text-slate-600">Product Name</th>
                <th className="py-3 px-3 font-semibold text-slate-600">SKU</th>
                <th className="py-3 px-3 font-semibold text-slate-600">Category</th>
                <th className="py-3 px-3 font-semibold text-slate-600">Sell Price</th>
                <th className="py-3 px-3 font-semibold text-slate-600">Cost Price</th>
                <th className="py-3 px-3 font-semibold text-slate-600">Stock</th>
                <th className="py-3 px-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-400 text-sm">No products found</p>
                  </td>
                </tr>
              )}
              {filtered.map((item) => {
                const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;
                const isOut = item.stock === 0;
                return (
                  <tr key={item.id} className={`border-b border-slate-100 transition-colors ${isOut ? "bg-red-50/60" : isLow ? "bg-amber-50/60" : "hover:bg-slate-50/60"}`}>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.name}
                      {isOut && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Out</span>}
                      {isLow && !isOut && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Low</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="py-3 px-3 text-slate-600">{item.category}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{sym}{item.sellingPrice}</td>
                    <td className="py-3 px-3 text-slate-500">{sym}{item.costPrice}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustStock(item.id, -1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-slate-600 transition-colors font-bold">
                          <Minus size={12} />
                        </button>
                        <span className={`w-8 text-center font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"}`}>
                          {item.stock}
                        </span>
                        <button onClick={() => adjustStock(item.id, 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-green-50 hover:border-green-200 hover:text-green-600 flex items-center justify-center text-slate-600 transition-colors font-bold">
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors mr-1">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">{modalMode === "add" ? "Add New Product" : "Edit Product"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Product Name */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-slate-700">Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rice 5kg" />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <Label className="text-slate-700">SKU / Barcode</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. RICE-5KG" />
            </div>

            {/* HSN Code — only shown when global GST is enabled */}
            {settings.globalGstEnabled ? (
              <div className="space-y-1.5">
                <Label className="text-slate-700">HSN Code <span className="text-slate-400 font-normal">(Optional)</span></Label>
                <Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} placeholder="e.g. 1006 (Rice)" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Grains" />
              </div>
            )}

            {/* Category — shown in second slot when GST is on */}
            {settings.globalGstEnabled && (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Grains" />
              </div>
            )}

            {/* Selling Price */}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Selling Price ({sym}) *</Label>
              <Input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
              {formErrors.sellingPrice && <p className="text-xs text-red-500">{formErrors.sellingPrice}</p>}
            </div>

            {/* Cost Price */}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Cost Price ({sym}) *</Label>
              <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" />
              {formErrors.costPrice && <p className="text-xs text-red-500">{formErrors.costPrice}</p>}
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Current Stock (units) *</Label>
              <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              {formErrors.stock && <p className="text-xs text-red-500">{formErrors.stock}</p>}
            </div>

            {/* Low stock threshold */}
            <div className="space-y-1.5">
              <Label className="text-slate-700">Low Stock Alert (below)</Label>
              <Input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="5" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
              {modalMode === "add" ? "Add Product" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader><DialogTitle className="text-slate-800">Delete Product?</DialogTitle></DialogHeader>
          <p className="text-slate-600 text-sm py-2">
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from inventory? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
