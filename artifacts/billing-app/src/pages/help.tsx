import React, { useState } from "react";
import {
  Calculator, PackageSearch, FileText, BarChart3, BookOpen, Settings,
  Mail, HelpCircle, Languages,
} from "lucide-react";

type Lang = "en" | "hi";

const content = {
  en: {
    title: "Help & Support",
    subtitle: "Everything you need to run your shop smoothly",
    langBtn: "हिंदी में देखें",
    features: [
      {
        icon: Calculator,
        title: "Billing Terminal",
        desc: "Create bills instantly. Search and add items from your inventory, apply GST, give discounts, accept Cash / UPI / Card / Credit (Udhaar), and print or share receipts on WhatsApp.",
        color: "text-primary bg-primary/8",
      },
      {
        icon: PackageSearch,
        title: "Inventory Management",
        desc: "Add products with selling price, cost price, HSN code, and category. Track live stock levels with low-stock alerts. Edit quantities directly or let billing deduct stock automatically.",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        icon: FileText,
        title: "Invoices & History",
        desc: "View all past bills with filters by payment type and status. Mark credit bills as paid, or cancel a bill to restore stock automatically.",
        color: "text-violet-600 bg-violet-50",
      },
      {
        icon: BarChart3,
        title: "Reports & Analytics",
        desc: "See revenue, profit, GST summary, and break-even target. Export data as a CSV file for GST filing. View bar charts, pie charts, and customer spend analysis.",
        color: "text-amber-600 bg-amber-50",
      },
      {
        icon: BookOpen,
        title: "Khata Ledger (Udhaar)",
        desc: "Track credit given to each customer. Add udhaar entries, record payments, and see who owes what at a glance. All transactions are timestamped.",
        color: "text-rose-600 bg-rose-50",
      },
      {
        icon: Settings,
        title: "Shop Settings",
        desc: "Set your shop name, owner name, address, phone, GSTIN, and thank-you message. Configure monthly overhead for BEP calculation. Enable or disable GST features globally.",
        color: "text-slate-600 bg-slate-100",
      },
    ],
    faq: [
      { q: "How do I add a new product?", a: "Go to Inventory → click the '+' button at the top right → fill in the product details and save." },
      { q: "How does stock get deducted?", a: "When you finalize a bill, stock is automatically deducted for each item that has a matching inventory entry." },
      { q: "What is Break-Even Point (BEP)?", a: "BEP tells you the minimum monthly revenue needed to cover your fixed costs. Set your monthly overhead (rent, salaries, bills) in Shop Settings to see it on the Reports page." },
      { q: "Can I use this offline?", a: "Yes! All data is saved locally on your device. The app works fully offline once loaded. You can also install it as a PWA for a faster, app-like experience." },
      { q: "How do I print a receipt?", a: "Open the Billing Terminal, add your items, then click 'Print / PDF'. The receipt will open in your browser's print dialog." },
    ],
    contactTitle: "Contact Us",
    contactSub: "Having trouble or want to send feedback? Email us directly.",
    contactEmail: "bms0businessmanagementsystem@gmail.com",
    contactBtn: "Send an Email",
  },
  hi: {
    title: "सहायता और समर्थन",
    subtitle: "अपनी दुकान आसानी से चलाने के लिए सब कुछ यहाँ है",
    langBtn: "See in English",
    features: [
      {
        icon: Calculator,
        title: "बिलिंग टर्मिनल",
        desc: "तुरंत बिल बनाएं। इन्वेंटरी से आइटम खोजें, GST लगाएं, डिस्काउंट दें, नकद / UPI / कार्ड / उधार स्वीकार करें, और WhatsApp पर रसीद भेजें।",
        color: "text-primary bg-primary/8",
      },
      {
        icon: PackageSearch,
        title: "इन्वेंटरी प्रबंधन",
        desc: "बिक्री मूल्य, लागत मूल्य, HSN कोड और श्रेणी के साथ उत्पाद जोड़ें। कम स्टॉक अलर्ट के साथ लाइव स्टॉक देखें। बिलिंग करने पर स्टॉक अपने आप कम होता है।",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        icon: FileText,
        title: "चालान और इतिहास",
        desc: "भुगतान प्रकार और स्थिति के अनुसार सभी पुराने बिल देखें। क्रेडिट बिल को भुगतान किया गया मार्क करें या बिल रद्द करके स्टॉक वापस पाएं।",
        color: "text-violet-600 bg-violet-50",
      },
      {
        icon: BarChart3,
        title: "रिपोर्ट और विश्लेषण",
        desc: "राजस्व, लाभ, GST सारांश और ब्रेक-ईवन लक्ष्य देखें। GST फाइलिंग के लिए CSV डाउनलोड करें। बार चार्ट, पाई चार्ट और ग्राहक खर्च विश्लेषण देखें।",
        color: "text-amber-600 bg-amber-50",
      },
      {
        icon: BookOpen,
        title: "खाता बही (उधार)",
        desc: "हर ग्राहक का उधार ट्रैक करें। उधार एंट्री जोड़ें, भुगतान दर्ज करें, और देखें कि कौन कितना बकाया है। सभी लेनदेन की तारीख और समय दर्ज है।",
        color: "text-rose-600 bg-rose-50",
      },
      {
        icon: Settings,
        title: "दुकान सेटिंग्स",
        desc: "दुकान का नाम, मालिक का नाम, पता, फोन, GSTIN और धन्यवाद संदेश सेट करें। BEP गणना के लिए मासिक ओवरहेड कॉन्फ़िगर करें।",
        color: "text-slate-600 bg-slate-100",
      },
    ],
    faq: [
      { q: "नया उत्पाद कैसे जोड़ें?", a: "इन्वेंटरी में जाएं → ऊपर दाएं '+' बटन पर क्लिक करें → उत्पाद की जानकारी भरें और सेव करें।" },
      { q: "स्टॉक कैसे कम होता है?", a: "जब आप बिल फाइनल करते हैं, तो मिलान वाले इन्वेंटरी आइटम का स्टॉक अपने आप कम हो जाता है।" },
      { q: "ब्रेक-ईवन पॉइंट क्या है?", a: "BEP बताता है कि आपकी निश्चित लागत पूरी करने के लिए कितना मासिक राजस्व चाहिए। दुकान सेटिंग्स में मासिक ओवरहेड सेट करें।" },
      { q: "क्या यह ऑफलाइन चलता है?", a: "हाँ! सारा डेटा आपके डिवाइस में सेव होता है। एक बार लोड होने के बाद यह पूरी तरह ऑफलाइन काम करता है।" },
      { q: "रसीद कैसे प्रिंट करें?", a: "बिलिंग टर्मिनल खोलें, आइटम जोड़ें, फिर 'Print / PDF' पर क्लिक करें।" },
    ],
    contactTitle: "हमसे संपर्क करें",
    contactSub: "कोई समस्या है या सुझाव देना चाहते हैं? हमें सीधे ईमेल करें।",
    contactEmail: "bms0businessmanagementsystem@gmail.com",
    contactBtn: "ईमेल भेजें",
  },
};

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
        <button
          onClick={() => setLang(l => l === "en" ? "hi" : "en")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
        >
          <Languages size={15} />
          {c.langBtn}
        </button>
      </div>

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
        <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide mb-4">
          {lang === "en" ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले सवाल"}
        </h2>
        <div className="space-y-4">
          {c.faq.map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-slate-800 mb-1">Q: {item.q}</p>
              <p className="text-sm text-slate-500 leading-relaxed pl-4 border-l-2 border-primary/30">
                {item.a}
              </p>
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
            {c.contactEmail}
          </code>
          <a
            href={`mailto:${c.contactEmail}?subject=BMS Support Query`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Mail size={14} />
            {c.contactBtn}
          </a>
        </div>
      </div>

      {/* App version note */}
      <p className="text-center text-xs text-slate-400">
        BMS – Business Management System · All data stored locally on your device
      </p>
    </div>
  );
}
