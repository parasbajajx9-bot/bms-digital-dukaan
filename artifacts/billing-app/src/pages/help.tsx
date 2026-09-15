import React, { useState } from "react";
import {
  Calculator, PackageSearch, FileText, BarChart3, BookOpen, Settings,
  Mail, HelpCircle, Download, Clock3, CircleCheck,
} from "lucide-react";

type Lang = "en" | "hi" | "hl";

const content = {
  en: {
    title: "Help & Support",
    subtitle: "Everything you need to run your shop smoothly",
    features: [
      { icon: Calculator,   title: "Billing Terminal",          color: "text-primary bg-primary/8",       desc: "Create bills instantly. Search and add items from your inventory, apply GST, give discounts, accept Cash / UPI / Card / Credit (Udhaar), and print or share receipts on WhatsApp." },
      { icon: PackageSearch,title: "Inventory Management",      color: "text-emerald-600 bg-emerald-50",  desc: "Add products with selling price, cost price, HSN code, and category. Track live stock levels with low-stock alerts. Edit quantities directly or let billing deduct stock automatically." },
      { icon: FileText,     title: "Invoices & History",        color: "text-violet-600 bg-violet-50",    desc: "View all past bills with filters by payment type and status. Mark credit bills as paid, or cancel a bill to restore stock automatically." },
      { icon: BarChart3,    title: "Reports & Analytics",       color: "text-amber-600 bg-amber-50",      desc: "See revenue, profit, and GST summary. Export data as a CSV file for GST filing. View bar charts, pie charts, and customer spend analysis." },
      { icon: BookOpen,     title: "Khata Ledger (Udhaar)",     color: "text-rose-600 bg-rose-50",        desc: "Track credit given to each customer. Add udhaar entries, record payments, and see who owes what at a glance. All transactions are timestamped." },
      { icon: Settings,     title: "Shop Settings",             color: "text-slate-600 bg-slate-100",     desc: "Set your shop name, owner name, address, phone, GSTIN, and thank-you message. Enable or disable GST features globally." },
    ],
    faq: [
      { q: "How do I add a new product?",      a: "Go to Inventory → click the '+' button at the top right → fill in the product details and save." },
      { q: "How does stock get deducted?",     a: "When you finalize a bill, stock is automatically deducted for each item that has a matching inventory entry." },
      { q: "Can I use this offline?",          a: "Yes! All data is saved locally on your device. The app works fully offline once loaded. You can also install it as a PWA for a faster, app-like experience." },
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
      { icon: Calculator,   title: "बिलिंग टर्मिनल",       color: "text-primary bg-primary/8",       desc: "तुरंत बिल बनाएं। इन्वेंटरी से आइटम खोजें, GST लगाएं, डिस्काउंट दें, नकद / UPI / कार्ड / उधार स्वीकार करें, और WhatsApp पर रसीद भेजें।" },
      { icon: PackageSearch,title: "इन्वेंटरी प्रबंधन",   color: "text-emerald-600 bg-emerald-50",  desc: "बिक्री मूल्य, लागत मूल्य, HSN कोड और श्रेणी के साथ उत्पाद जोड़ें। कम स्टॉक अलर्ट के साथ लाइव स्टॉक देखें। बिलिंग करने पर स्टॉक अपने आप कम होता है।" },
      { icon: FileText,     title: "चालान और इतिहास",     color: "text-violet-600 bg-violet-50",    desc: "भुगतान प्रकार और स्थिति के अनुसार सभी पुराने बिल देखें। क्रेडिट बिल को भुगतान किया गया मार्क करें या बिल रद्द करके स्टॉक वापस पाएं।" },
      { icon: BarChart3,    title: "रिपोर्ट और विश्लेषण", color: "text-amber-600 bg-amber-50",      desc: "राजस्व, लाभ और GST सारांश देखें। GST फाइलिंग के लिए CSV डाउनलोड करें। बार चार्ट, पाई चार्ट और ग्राहक खर्च विश्लेषण देखें।" },
      { icon: BookOpen,     title: "खाता बही (उधार)",     color: "text-rose-600 bg-rose-50",        desc: "हर ग्राहक का उधार ट्रैक करें। उधार एंट्री जोड़ें, भुगतान दर्ज करें, और देखें कि कौन कितना बकाया है। सभी लेनदेन की तारीख और समय दर्ज है।" },
      { icon: Settings,     title: "दुकान सेटिंग्स",      color: "text-slate-600 bg-slate-100",     desc: "दुकान का नाम, मालिक का नाम, पता, फोन, GSTIN और धन्यवाद संदेश सेट करें।" },
    ],
    faq: [
      { q: "नया उत्पाद कैसे जोड़ें?",           a: "इन्वेंटरी में जाएं → ऊपर दाएं '+' बटन पर क्लिक करें → उत्पाद की जानकारी भरें और सेव करें।" },
      { q: "स्टॉक कैसे कम होता है?",            a: "जब आप बिल फाइनल करते हैं, तो मिलान वाले इन्वेंटरी आइटम का स्टॉक अपने आप कम हो जाता है।" },
      { q: "क्या यह ऑफलाइन चलता है?",           a: "हाँ! सारा डेटा आपके डिवाइस में सेव होता है। एक बार लोड होने के बाद यह पूरी तरह ऑफलाइन काम करता है।" },
      { q: "रसीद कैसे प्रिंट करें?",             a: "बिलिंग टर्मिनल खोलें, आइटम जोड़ें, फिर 'Print / PDF' पर क्लिक करें।" },
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
      { icon: Calculator,   title: "Billing Terminal",       color: "text-primary bg-primary/8",       desc: "Bill banao ek dum jaldi. Inventory se item search karo, GST lagao, discount do, Cash / UPI / Card / Udhaar accept karo, aur WhatsApp pe receipt bhejo." },
      { icon: PackageSearch,title: "Inventory Management",  color: "text-emerald-600 bg-emerald-50",  desc: "Products ka selling price, cost price, HSN code aur category ke saath add karo. Low-stock alerts ke saath live stock dekhte raho. Billing se stock automatically cut hota hai." },
      { icon: FileText,     title: "Invoices aur History",  color: "text-violet-600 bg-violet-50",    desc: "Purane saare bills payment type aur status ke hisaab se dekho. Credit bill ko paid mark karo, ya bill cancel karke stock wapas pao." },
      { icon: BarChart3,    title: "Reports aur Analytics", color: "text-amber-600 bg-amber-50",      desc: "Revenue, profit aur GST summary dekho. GST filing ke liye CSV export karo. Bar charts, pie charts aur customer spend analysis bhi hai." },
      { icon: BookOpen,     title: "Khata Ledger (Udhaar)", color: "text-rose-600 bg-rose-50",        desc: "Har customer ka udhaar track karo. Udhaar entries add karo, payment record karo, aur ek nazar mein dekho kaun kitna baaki hai. Sab transactions ki date aur time save hoti hai." },
      { icon: Settings,     title: "Shop Settings",         color: "text-slate-600 bg-slate-100",     desc: "Dukaan ka naam, malik ka naam, address, phone, GSTIN aur thank-you message set karo. GST globally on/off kar sakte ho." },
    ],
    faq: [
      { q: "Naya product kaise add karein?",   a: "Inventory mein jao → upar right mein '+' button dabao → product ki details bharo aur save karo." },
      { q: "Stock kaise cut hota hai?",        a: "Jab bill finalize karte ho, toh matching inventory items ka stock apne aap kam ho jaata hai." },
      { q: "Kya ye offline kaam karta hai?",   a: "Haan! Saara data aapke device mein locally save hota hai. Ek baar load hone ke baad puri tarah offline kaam karta hai. PWA install karke aur bhi fast experience milta hai." },
      { q: "Receipt kaise print karein?",      a: "Billing Terminal kholo, items add karo, fir 'Print / PDF' dabao. Receipt browser ke print dialog mein khulegi." },
    ],
    faqTitle: "Aksar Puche Jaane Wale Sawal",
    contactTitle: "Humse Sampark Karein",
    contactSub: "Koi problem hai ya feedback dena chahte ho? Humhe directly email karo.",
    contactBtn: "Email Bhejo",
  },
};

const SUPPORT_EMAIL = "bms0businessmanagementsystem@gmail.com";

const LANG_TABS: { key: Lang; label: string }[] = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी" },
  { key: "hl", label: "Hinglish" },
];

export default function HelpPage() {
  const [lang, setLang] = useState<Lang>("en");
  const c = content[lang];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={22} className="text-primary" />
            <h1 className="text-xl font-extrabold text-slate-800">{c.title}</h1>
          </div>
          <p className="text-slate-500 text-sm">{c.subtitle}</p>
        </div>
        {/* 3-way language toggle */}
        <div className="flex gap-0.5 bg-slate-100 rounded-xl p-1">
          {LANG_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setLang(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === t.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product demo */}
      <section className="help-demo-panel" aria-labelledby="demo-title">
        <div className="help-demo-heading">
          <div>
            <div className="help-demo-kicker"><span className="help-demo-dot" /> See BMS in motion</div>
            <h2 id="demo-title">A faster day at the counter.</h2>
            <p>A 30-second tour of the tools that keep your shop moving. The framed screens are ready for your own dashboard recordings.</p>
          </div>
          <a
            href={`${import.meta.env.BASE_URL}bms-product-demo.mp4`}
            download="bms-product-demo.mp4"
            className="help-download-link"
          >
            <Download size={15} />
            Download video
          </a>
        </div>
        <iframe
          src={`${import.meta.env.BASE_URL}`}
          title="Live BMS dashboard preview"
          style={{
            width: "100%",
            height: "350px",
            border: "none",
            overflow: "hidden",
            display: "block",
          }}
          scrolling="no"
        />
        <div className="help-demo-meta">
          <span><CircleCheck size={14} /> Auto-plays and loops</span>
          <span><Clock3 size={14} /> 30 seconds</span>
          <span>16:9 landscape</span>
          <span className="help-demo-note">Recording placeholders are labeled in-frame</span>
        </div>
      </section>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {c.features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.title} className="glass-panel p-4 flex gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${feat.color}`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 mb-0.5">{feat.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="glass-panel p-5">
        <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-4">{c.faqTitle}</h2>
        <div className="space-y-4">
          {c.faq.map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-slate-800 mb-1">Q: {item.q}</p>
              <p className="text-sm text-slate-500 leading-relaxed pl-4 border-l-2 border-primary/30">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact card */}
      <div className="glass-panel p-5 bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-primary" />
          <h2 className="text-base font-extrabold text-slate-800">{c.contactTitle}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">{c.contactSub}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <code className="text-sm font-mono bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-700 break-all">
            {SUPPORT_EMAIL}
          </code>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=BMS Support Query`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Mail size={14} />
            {c.contactBtn}
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        BMS – Business Management System · All data stored locally on your device
      </p>
    </div>
  );
}
