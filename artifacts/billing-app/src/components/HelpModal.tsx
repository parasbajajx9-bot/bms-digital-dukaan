import React, { useState } from "react";
import { X, HelpCircle, Calculator, PackageSearch, FileText, BarChart3, BookOpen, Settings, Mail } from "lucide-react";

type Lang = "en" | "hi" | "hl";

const LANG_TABS: { key: Lang; label: string }[] = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी" },
  { key: "hl", label: "Hinglish" },
];

const SUPPORT_EMAIL = "bms0businessmanagementsystem@gmail.com";

const content = {
  en: {
    title: "Help & Support",
    subtitle: "Everything you need to run your shop smoothly",
    features: [
      { icon: Calculator,    title: "Billing Terminal",        color: "text-primary bg-primary/8",      desc: "Create bills instantly. Search and add items from your inventory, apply GST, give discounts, accept Cash / UPI / Card / Credit (Udhaar), and print or share receipts on WhatsApp." },
      { icon: PackageSearch, title: "Inventory Management",   color: "text-emerald-600 bg-emerald-50", desc: "Add products with selling price, cost price, HSN code, and category. Track live stock levels with low-stock alerts. Edit quantities directly or let billing deduct stock automatically." },
      { icon: FileText,      title: "Invoices & History",     color: "text-violet-600 bg-violet-50",   desc: "View all past bills with filters by payment type and status. Mark credit bills as paid, or cancel a bill to restore stock automatically." },
      { icon: BarChart3,     title: "Reports & Analytics",    color: "text-amber-600 bg-amber-50",     desc: "See revenue, profit, and GST summary. Export data as a CSV file for GST filing. View bar charts, pie charts, and customer spend analysis." },
      { icon: BookOpen,      title: "Khata Ledger (Udhaar)",  color: "text-rose-600 bg-rose-50",       desc: "Track credit given to each customer. Add udhaar entries, record payments, and see who owes what at a glance. All transactions are timestamped." },
      { icon: Settings,      title: "Shop Settings",          color: "text-slate-600 bg-slate-100",    desc: "Set your shop name, owner name, address, phone, GSTIN, and thank-you message. Enable or disable GST features globally." },
    ],
    faq: [
      { q: "How do I add a new product?",      a: "Go to Inventory → click the '+' button at the top right → fill in the product details and save." },
      { q: "How does stock get deducted?",     a: "When you finalize a bill, stock is automatically deducted for each item that has a matching inventory entry." },
      { q: "Can I use this offline?",          a: "Yes! All data is saved locally on your device. The app works fully offline once loaded." },
      { q: "How do I print a receipt?",        a: "Open the Billing Terminal, add your items, then click 'Print / PDF'. The receipt will open in your browser's print dialog." },
    ],
    faqTitle: "Frequently Asked Questions",
    contactTitle: "Contact Us",
    contactSub: "Having trouble or want to send feedback? Email us directly.",
    contactBtn: "Send an Email",
  },
  hi: {
    title: "सहायता और समर्थन",
    subtitle: "अपनी दुकान आसानी से चलाने के लिए सब कुछ यहाँ है",
    features: [
      { icon: Calculator,    title: "बिलिंग टर्मिनल",       color: "text-primary bg-primary/8",      desc: "तुरंत बिल बनाएं। इन्वेंटरी से आइटम खोजें, GST लगाएं, डिस्काउंट दें, नकद / UPI / कार्ड / उधार स्वीकार करें, और WhatsApp पर रसीद भेजें।" },
      { icon: PackageSearch, title: "इन्वेंटरी प्रबंधन",  color: "text-emerald-600 bg-emerald-50", desc: "बिक्री मूल्य, लागत मूल्य, HSN कोड और श्रेणी के साथ उत्पाद जोड़ें। कम स्टॉक अलर्ट के साथ लाइव स्टॉक देखें।" },
      { icon: FileText,      title: "चालान और इतिहास",    color: "text-violet-600 bg-violet-50",   desc: "भुगतान प्रकार और स्थिति के अनुसार सभी पुराने बिल देखें। क्रेडिट बिल को paid mark करें या बिल cancel करके स्टॉक वापस पाएं।" },
      { icon: BarChart3,     title: "रिपोर्ट और विश्लेषण",color: "text-amber-600 bg-amber-50",     desc: "राजस्व, लाभ, GST सारांश देखें। GST फाइलिंग के लिए CSV डाउनलोड करें।" },
      { icon: BookOpen,      title: "खाता बही (उधार)",    color: "text-rose-600 bg-rose-50",       desc: "हर ग्राहक का उधार ट्रैक करें। उधार एंट्री जोड़ें, भुगतान दर्ज करें।" },
      { icon: Settings,      title: "दुकान सेटिंग्स",     color: "text-slate-600 bg-slate-100",    desc: "दुकान का नाम, मालिक का नाम, पता, फोन, GSTIN और धन्यवाद संदेश सेट करें।" },
    ],
    faq: [
      { q: "नया उत्पाद कैसे जोड़ें?",  a: "इन्वेंटरी में जाएं → '+' बटन पर क्लिक करें → उत्पाद की जानकारी भरें और सेव करें।" },
      { q: "स्टॉक कैसे कम होता है?",   a: "जब आप बिल फाइनल करते हैं, तो मिलान वाले इन्वेंटरी आइटम का स्टॉक अपने आप कम हो जाता है।" },
      { q: "क्या यह ऑफलाइन चलता है?", a: "हाँ! सारा डेटा आपके डिवाइस में लोकली सेव होता है।" },
      { q: "रसीद कैसे प्रिंट करें?",   a: "बिलिंग टर्मिनल खोलें, आइटम जोड़ें, फिर 'Print / PDF' पर क्लिक करें।" },
    ],
    faqTitle: "अक्सर पूछे जाने वाले सवाल",
    contactTitle: "हमसे संपर्क करें",
    contactSub: "कोई समस्या है या सुझाव देना चाहते हैं? हमें सीधे ईमेल करें।",
    contactBtn: "ईमेल भेजें",
  },
  hl: {
    title: "Help aur Support",
    subtitle: "Apni dukaan smoothly chalane ke liye sab kuch yahan hai",
    features: [
      { icon: Calculator,    title: "Billing Terminal",      color: "text-primary bg-primary/8",      desc: "Bill banao ek dum jaldi. Inventory se item search karo, GST lagao, discount do, Cash / UPI / Card / Udhaar accept karo, aur WhatsApp pe receipt bhejo." },
      { icon: PackageSearch, title: "Inventory Management", color: "text-emerald-600 bg-emerald-50", desc: "Products add karo selling price, cost price, HSN code aur category ke saath. Low-stock alerts ke saath live stock dekhte raho." },
      { icon: FileText,      title: "Invoices aur History", color: "text-violet-600 bg-violet-50",   desc: "Purane saare bills payment type aur status ke hisaab se dekho. Credit bill ko paid mark karo ya cancel karke stock wapas pao." },
      { icon: BarChart3,     title: "Reports aur Analytics",color: "text-amber-600 bg-amber-50",     desc: "Revenue, profit, GST summary dekho. GST filing ke liye CSV export karo." },
      { icon: BookOpen,      title: "Khata Ledger (Udhaar)",color: "text-rose-600 bg-rose-50",       desc: "Har customer ka udhaar track karo. Udhaar entries add karo, payment record karo." },
      { icon: Settings,      title: "Shop Settings",        color: "text-slate-600 bg-slate-100",    desc: "Dukaan ka naam, malik ka naam, address, phone, GSTIN aur thank-you message set karo." },
    ],
    faq: [
      { q: "Naya product kaise add karein?", a: "Inventory mein jao → '+' button dabao → product ki details bharo aur save karo." },
      { q: "Stock kaise cut hota hai?",      a: "Jab bill finalize karte ho, toh matching inventory items ka stock apne aap kam ho jaata hai." },
      { q: "Kya ye offline kaam karta hai?", a: "Haan! Saara data device mein locally save hota hai. Ek baar load hone ke baad puri tarah offline." },
      { q: "Receipt kaise print karein?",    a: "Billing Terminal kholo, items add karo, fir 'Print / PDF' dabao." },
    ],
    faqTitle: "Aksar Puche Jaane Wale Sawal",
    contactTitle: "Humse Sampark Karein",
    contactSub: "Koi problem hai ya feedback dena chahte ho? Humhe directly email karo.",
    contactBtn: "Email Bhejo",
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: Props) {
  const [lang, setLang] = useState<Lang>("en");

  if (!open) return null;

  const c = content[lang];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-spring max-w-md w-full mx-auto bg-white/90 backdrop-blur-md rounded-[24px] shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle size={17} className="text-primary" />
            <h2 className="text-sm font-extrabold text-slate-800">{c.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
              {LANG_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setLang(t.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    lang === t.key ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">{c.subtitle}</p>

          {/* Feature guides */}
          <div className="space-y-2">
            {c.features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="flex gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${feat.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 mb-0.5">{feat.title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">{c.faqTitle}</p>
            <div className="space-y-3">
              {c.faq.map((item) => (
                <div key={item.q}>
                  <p className="text-xs font-semibold text-slate-800 mb-1">Q: {item.q}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-3 border-l-2 border-primary/30">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Mail size={14} className="text-primary" />
              <h3 className="text-xs font-extrabold text-slate-800">{c.contactTitle}</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">{c.contactSub}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=BMS Support Query`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Mail size={12} />
              {c.contactBtn}
            </a>
          </div>

          <p className="text-center text-[10px] text-slate-400 pb-1">
            BMS – Business Management System · All data stored locally on your device
          </p>
        </div>
      </div>
    </div>
  );
}
