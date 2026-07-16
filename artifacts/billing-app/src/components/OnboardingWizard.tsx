import React, { useState } from "react";
import { Store, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/storage";

interface Props {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  const handleComplete = () => {
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      shopName: shopName.trim() || "My Shop",
      ownerName: ownerName.trim(),
      phone: phone.trim(),
    });
    window.dispatchEvent(new Event("shop-settings-updated"));
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary/20 via-cyan-500/10 to-emerald-400/10 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Top gradient bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />

        <div className="p-6">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-4 bg-slate-200"
              }`} />
            ))}
          </div>

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-cyan-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 mb-2">Namaste! 🙏</h1>
              <p className="text-slate-600 text-sm leading-relaxed mb-1">
                <strong>Mera naam Paras hai.</strong>
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Aapki digital dukaan setup karne mein main aapki madad karunga. Sirf 2 kadam mein aapki dukaan tayaar ho jaayegi!
              </p>
              <Button className="w-full bg-primary text-white font-semibold" onClick={() => setStep(1)}>
                Shuru Karein <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1 — Shop Name */}
          {step === 1 && (
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Store size={22} className="text-primary" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Aapki dukaan ka naam?</h2>
              <p className="text-slate-500 text-sm mb-5">
                Yeh naam aapke receipts aur invoices par dikhega.
              </p>
              <div className="space-y-2 mb-6">
                <Label className="text-slate-700">Shop Name *</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Sharma General Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="text-base"
                  onKeyDown={(e) => { if (e.key === "Enter" && shopName.trim()) setStep(2); }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button
                  className="flex-1 bg-primary text-white font-semibold"
                  disabled={!shopName.trim()}
                  onClick={() => setStep(2)}
                >
                  Aage Badhein <ArrowRight size={15} className="ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Owner & Phone */}
          {step === 2 && (
            <div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <Check size={22} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Thoda aur jaankari…</h2>
              <p className="text-slate-500 text-sm mb-5">
                Yeh optional hai — baad mein Settings mein bhi change kar sakte hain.
              </p>
              <div className="space-y-3 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Owner / Malik ka Naam</Label>
                  <Input
                    autoFocus
                    placeholder="e.g. Rajesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                  />
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5 text-center">
                <p className="text-sm font-semibold text-slate-800">"{shopName}"</p>
                <p className="text-xs text-slate-500 mt-0.5">Aapki dukaan tayaar hai! 🎉</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 bg-primary text-white font-bold" onClick={handleComplete}>
                  Dashboard Kholo 🚀
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
