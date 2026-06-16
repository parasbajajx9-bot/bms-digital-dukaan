import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Calculator, BookOpen, PackageSearch, BarChart3, Settings, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopSettings } from "@/lib/useShopSettings";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings, saveSettings } = useShopSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState({ ...settings });

  const navItems = [
    { path: "/billing", label: "Billing Terminal", icon: Calculator },
    { path: "/khata", label: "Khata Ledger", icon: BookOpen },
    { path: "/inventory", label: "Inventory", icon: PackageSearch },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const handleOpenSettings = () => {
    setForm({ ...settings });
    setSettingsOpen(true);
  };

  const handleSave = () => {
    saveSettings(form);
    setSettingsOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      <div className="w-60 flex-shrink-0 sidebar-glass h-full flex flex-col pt-6 z-10">
        <button
          onClick={handleOpenSettings}
          className="px-6 mb-8 text-left group w-full"
          data-testid="btn-open-settings"
        >
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors truncate max-w-[140px]">
                {settings.shopName}
              </h1>
              <p className="text-xs text-slate-500 truncate max-w-[140px]">{settings.ownerName}</p>
            </div>
            <Settings size={14} className="ml-auto text-slate-400 group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </button>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path || (location === "/" && item.path === "/billing");
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200/60">
          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150"
            data-testid="btn-settings-bottom"
          >
            <Settings size={18} />
            <span className="text-sm">Shop Settings</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Shop Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-700">Shop Name</Label>
              <Input
                value={form.shopName}
                onChange={e => setForm({ ...form, shopName: e.target.value })}
                placeholder="e.g. Sharma General Store"
                data-testid="input-shop-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Owner Name</Label>
              <Input
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                data-testid="input-owner-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Address / Location</Label>
              <Input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 12 Gandhi Nagar, Delhi"
                data-testid="input-shop-address"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Contact Phone</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                data-testid="input-shop-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">GSTIN (Optional)</Label>
              <Input
                value={form.gstin}
                onChange={e => setForm({ ...form, gstin: e.target.value })}
                placeholder="e.g. 22AAAAA0000A1Z5"
                data-testid="input-shop-gstin"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700">Thank You Message</Label>
              <Input
                value={form.thankYouMessage}
                onChange={e => setForm({ ...form, thankYouMessage: e.target.value })}
                placeholder="e.g. Thank you for shopping with us!"
                data-testid="input-thank-you"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="btn-save-settings">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
