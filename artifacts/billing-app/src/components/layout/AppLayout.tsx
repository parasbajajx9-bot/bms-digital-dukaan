import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Calculator, BookOpen, PackageSearch, BarChart3, Settings, Store, Info, Github, Mail, Globe,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopSettings } from "@/lib/useShopSettings";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings, saveSettings } = useShopSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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
        {/* Shop name / settings trigger */}
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

        {/* Nav */}
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
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-200/60 space-y-1">
          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150"
            data-testid="btn-settings-bottom"
          >
            <Settings size={18} />
            <span className="text-sm">Shop Settings</span>
          </button>
          <button
            onClick={() => setAboutOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150"
            data-testid="btn-about-developer"
          >
            <Info size={18} />
            <span className="text-sm">About Developer</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      {/* Shop Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Shop Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Shop Name", key: "shopName", placeholder: "e.g. Sharma General Store" },
              { label: "Owner Name", key: "ownerName", placeholder: "e.g. Rajesh Sharma" },
              { label: "Address / Location", key: "address", placeholder: "e.g. 12 Gandhi Nagar, Delhi" },
              { label: "Contact Phone", key: "phone", placeholder: "e.g. 9876543210" },
              { label: "GSTIN (Optional)", key: "gstin", placeholder: "e.g. 22AAAAA0000A1Z5" },
              { label: "Thank You Message", key: "thankYouMessage", placeholder: "Thank you for shopping with us!" },
            ].map(({ label, key, placeholder }) => (
              <div className="space-y-1.5" key={key}>
                <Label className="text-slate-700">{label}</Label>
                <Input
                  value={(form as any)[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  data-testid={`input-${key}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="btn-save-settings">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Developer Modal */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="sr-only">About Developer</DialogTitle>
          </DialogHeader>

          {/* Header gradient bar */}
          <div className="h-1.5 -mx-6 -mt-4 mb-5 rounded-t-xl bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-2xl font-extrabold select-none shadow-lg">
              D
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-800">Digital Dukaan Team</p>
              <p className="text-sm text-slate-500">Full-Stack Developer · India</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs text-emerald-600 font-medium">Open for freelance projects</span>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Our Mission</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Digital Dukaan was built to <strong>eliminate paper ledgers and manual billing</strong> for
              India's 60M+ local shop owners. We believe every kirana store, pharmacy, and small business
              deserves powerful digital tools — without needing an accountant or internet connection.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { emoji: "🧾", label: "GST-Ready Billing" },
              { emoji: "📒", label: "Khata / Udhaar Ledger" },
              { emoji: "📦", label: "Inventory Management" },
              { emoji: "📊", label: "Visual Sales Reports" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white border border-slate-200/60 rounded-lg px-3 py-2">
                <span className="text-base">{f.emoji}</span>
                <span className="text-xs font-medium text-slate-700">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-2 flex-wrap">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-medium transition-colors"
            >
              <Github size={13} /> GitHub
            </a>
            <a
              href="mailto:hello@digitaldukaan.in"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-medium transition-colors"
            >
              <Mail size={13} /> Contact
            </a>
            <a
              href="https://digitaldukaan.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-medium transition-colors"
            >
              <Globe size={13} /> Website
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Version 2.0 · Built with ❤️ in India</p>
            <Button size="sm" variant="outline" onClick={() => setAboutOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
