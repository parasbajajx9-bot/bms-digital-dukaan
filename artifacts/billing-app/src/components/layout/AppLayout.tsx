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
              { label: "Shop GSTIN (15-Digit Tax ID)", key: "gstin", placeholder: "e.g. 22AAAAA0000A1Z5" },
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
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">About Developer</DialogTitle>
          </DialogHeader>

          {/* Gradient hero banner */}
          <div className="h-24 bg-gradient-to-br from-primary via-cyan-500 to-emerald-400 relative flex-shrink-0">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>

          {/* Profile picture — overlaps banner */}
          <div className="flex flex-col items-center -mt-12 px-7 pb-0">
            <div className="relative">
              <img
                src="/my-profile.jpg"
                alt="Paras Bajaj"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                  const fallback = el.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              {/* Fallback initials avatar — hidden by default, shown if image 404s */}
              <div
                className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-primary to-cyan-400 items-center justify-center text-white text-3xl font-extrabold select-none"
                style={{ display: "none" }}
              >
                PB
              </div>
            </div>

            {/* Name + badges */}
            <div className="mt-3 text-center">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Paras Bajaj</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-primary/15 to-cyan-400/15 text-primary border border-primary/30 tracking-wide">
                  ✦ Founder
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  BBA · Kanpur
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                Dr. Virendra Swarup Institute of Computer Studies, Kanpur
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="px-7 mt-4">
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                I am a first-year BBA student at Dr. Virendra Swarup Institute of Computer Studies,
                Kanpur, passionate about financial technology and retail operations. Driven by the desire
                to help local small-business owners transition away from chaotic paper registers and manual
                credit (Udhaar) tracking, I designed and co-engineered this smart desktop terminal. This
                lightweight, premium platform gives everyday retail vendors simple, non-technical tools to
                manage <strong className="text-slate-700">GST-compliant billing</strong>,{" "}
                <strong className="text-slate-700">live inventory control</strong>, and{" "}
                <strong className="text-slate-700">digital ledger tracking</strong> effortlessly.
              </p>
            </div>
          </div>

          {/* Social links */}
          <div className="px-7 mt-4">
            <div className="flex gap-2">
              <a
                href="https://www.linkedin.com/in/paras-bajaj-752174314"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50 text-sm font-semibold transition-all duration-150"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/parasbajajx9-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-400 text-sm font-semibold transition-all duration-150"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Digital Dukaan · Built with ❤️ in India</p>
            <Button size="sm" variant="outline" onClick={() => setAboutOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
