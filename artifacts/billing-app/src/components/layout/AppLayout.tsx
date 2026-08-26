import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Calculator, BookOpen, PackageSearch, BarChart3, Settings, Store, Info, FileText,
  Menu, X, ChevronLeft, ChevronRight, HelpCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useShopSettings } from "@/lib/useShopSettings";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings, saveSettings } = useShopSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [form, setForm] = useState({ ...settings });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { path: "/billing", label: "Billing Terminal", icon: Calculator },
    { path: "/inventory", label: "Inventory", icon: PackageSearch },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/khata", label: "Khata Ledger", icon: BookOpen },
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
    <div className="flex h-screen w-full overflow-hidden text-foreground relative">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-10
        w-60 flex-shrink-0 sidebar-glass h-full flex flex-col pt-5
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${sidebarCollapsed ? "md:w-[58px]" : "md:w-60"}
      `}>

        {/* ── Expanded header ── */}
        <div className={`px-4 mb-6 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "md:hidden" : ""}`}>
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[140px]" title="BMS - Business Management System">
                BMS
              </h1>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">Business Management System</p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden md:flex ml-auto flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="md:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Collapsed state header ── */}
        <div className={`hidden transition-all duration-300 ${sidebarCollapsed ? "md:flex flex-col items-center gap-2 mb-5 pt-1" : ""}`}>
          <Store size={20} className="text-primary" />
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-hidden">
          {navItems.map((item) => {
            const isActive = location === item.path || (location === "/" && item.path === "/billing");
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150
                    ${sidebarCollapsed ? "md:justify-center md:px-0 px-3" : "px-3"}
                    ${isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom actions ── */}
        <div className="px-2 py-3 border-t border-slate-200/60 space-y-0.5">
          <Link href="/help">
            <div
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? "Help & Support" : undefined}
              className={`flex items-center gap-3 py-2.5 rounded-lg w-full transition-all duration-150 cursor-pointer
                ${sidebarCollapsed ? "md:justify-center md:px-0 px-3" : "px-3"}
                ${location === "/help"
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-700"}`}
            >
              <HelpCircle size={18} className="flex-shrink-0" />
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${sidebarCollapsed ? "md:hidden" : ""}`}>
                Help & Support
              </span>
            </div>
          </Link>
          <button
            onClick={() => { handleOpenSettings(); setSidebarOpen(false); }}
            title={sidebarCollapsed ? "Shop Settings" : undefined}
            className={`flex items-center gap-3 py-2.5 rounded-lg w-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150
              ${sidebarCollapsed ? "md:justify-center md:px-0 px-3" : "px-3"}`}
          >
            <Settings size={18} className="flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${sidebarCollapsed ? "md:hidden" : ""}`}>
              Shop Settings
            </span>
          </button>
          <button
            onClick={() => { setAboutOpen(true); setSidebarOpen(false); }}
            title={sidebarCollapsed ? "About Developer" : undefined}
            className={`flex items-center gap-3 py-2.5 rounded-lg w-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150
              ${sidebarCollapsed ? "md:justify-center md:px-0 px-3" : "px-3"}`}
          >
            <Info size={18} className="flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${sidebarCollapsed ? "md:hidden" : ""}`}>
              About Developer
            </span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 sidebar-glass border-b border-slate-200/60 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <Store size={17} className="text-primary flex-shrink-0" />
          <p className="text-sm font-bold text-slate-800 truncate flex-1">BMS – Business Management System</p>
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* ── Shop Settings Modal ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Shop Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {[
              { label: "Shop Name", key: "shopName", placeholder: "e.g. Sharma General Store" },
              { label: "Owner Name", key: "ownerName", placeholder: "e.g. Rajesh Sharma" },
              { label: "Address / Location", key: "address", placeholder: "e.g. 12 Gandhi Nagar, Delhi" },
              { label: "Contact Phone", key: "phone", placeholder: "e.g. 9876543210" },
              { label: "Thank You Message", key: "thankYouMessage", placeholder: "Thank you for shopping with us!" },
            ].map(({ label, key, placeholder }) => (
              <div className="space-y-1.5" key={key}>
                <Label className="text-slate-700">{label}</Label>
                <Input
                  value={(form as any)[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}

            {/* GST Section */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">GST & Tax Settings</p>
              <div className="flex items-center justify-between bg-slate-50/60 border border-slate-200/50 rounded-xl px-4 py-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Enable GST Features</p>
                  <p className="text-xs text-slate-500">Show HSN codes, CGST/SGST in billing & inventory</p>
                </div>
                <Switch
                  checked={form.globalGstEnabled ?? true}
                  onCheckedChange={(v) => setForm({ ...form, globalGstEnabled: v })}
                />
              </div>
              {(form.globalGstEnabled ?? true) && (
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Shop GSTIN <span className="text-slate-400 font-normal">(15-Digit Tax ID)</span></Label>
                  <Input
                    value={form.gstin ?? ""}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                  />
                </div>
              )}
            </div>

            {/* Currency Section */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Currency</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "INR", label: "₹ Indian Rupee", sub: "INR — ₹" },
                  { value: "USD", label: "$ US Dollar", sub: "USD — $" },
                ] as const).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, currency: c.value })}
                    className={`text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      (form.currency ?? "INR") === c.value
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-sm font-bold ${(form.currency ?? "INR") === c.value ? "text-primary" : "text-slate-700"}`}>{c.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── About Developer Modal ── */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-md bg-white p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">About Developer</DialogTitle>
          </DialogHeader>

          <div className="h-24 bg-gradient-to-br from-primary via-cyan-500 to-emerald-400 relative flex-shrink-0">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>

          <div className="flex flex-col items-center -mt-12 px-5 pb-0">
            <div className="relative">
              <img
                src="/my-profile.jpg"
                alt="Paras Bajaj"
                className="w-24 h-24 rounded-full object-cover object-center border-4 border-white shadow-xl"
              />
            </div>
            <div className="mt-3 text-center">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Paras Bajaj</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-primary/15 to-cyan-400/15 text-primary border border-primary/30 tracking-wide">
                  ✦ Founder
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Fintech · Retail Tech
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                Building modern tools for Indian retail businesses
              </p>
            </div>
          </div>

          <div className="px-5 mt-4 bg-slate-50/80 border border-slate-200/60 rounded-xl mx-5 p-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Driven by the vision to digitalize traditional Indian retail, I designed and engineered
              <strong className="text-slate-800"> BMS – Business Management System</strong>. Moving beyond basic billing,
              this comprehensive system empowers local vendors with advanced tools for
              <strong className="text-slate-700"> live inventory management</strong>,
              <strong className="text-slate-700"> digital credit (Khata) ledger analysis</strong>, and
              <strong className="text-slate-700"> automated data reports</strong>—all inside a seamless, premium terminal.
            </p>
          </div>

          <div className="px-5 mt-4">
            <a
              href="https://www.linkedin.com/in/paras-bajaj-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50 text-sm font-semibold transition-all duration-150"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn — Connect with Paras Bajaj
            </a>
          </div>

          <div className="px-5 py-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">BMS – Business Management System · Built with ❤️ in India</p>
            <Button size="sm" variant="outline" onClick={() => setAboutOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
