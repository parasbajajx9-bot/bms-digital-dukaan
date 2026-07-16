import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2 } from "lucide-react";
import { storage, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";

type Message = { role: "assistant" | "user"; text: string };

const SUPPORT_EMAIL = "bms0businessmanagementsystem@gmail.com";

function processMessage(text: string, aiName: string): string {
  const t = text.toLowerCase().trim();

  // Greeting
  if (/^(hi|hello|namaste|halo|hey|namaskar|jai|ram ram)\b/.test(t)) {
    return `Namaste! 🙏 Main ${aiName} hoon. Aapki kaise madad kar sakta hoon?\n\nAap mujhse pooch sakte hain:\n• Stock kitna hai?\n• Aaj ki sale?\n• Profit kitna hai?\n• Bug report / complaint`;
  }

  // Help / capabilities
  if (/help|kya kar|madad|features|capabilities|kya karta/.test(t)) {
    return `Main ${aiName} hoon — BMS ka AI assistant! 😊\n\nYeh kaam kar sakta hoon:\n📦 Inventory aur stock levels batana\n💰 Sales aur revenue summary\n📊 Profit margin estimate\n🐛 Bug report compose karna\n\nBas poochh lijiye — Hindi, English, ya Hinglish mein!`;
  }

  // Inventory / stock query
  if (/stock|inventory|items|products|maal|saman|kitna stok/.test(t)) {
    const inv = storage.getInventory();
    if (inv.length === 0) {
      return "Abhi inventory mein koi item nahi hai. Inventory page par jaakar products add karein! 📦";
    }
    const outOf = inv.filter(i => i.stock === 0);
    const low = inv.filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold);
    let reply = `📦 Aapke paas ${inv.length} products hain.\n`;
    if (outOf.length > 0) reply += `\n🔴 Out of stock (${outOf.length}): ${outOf.slice(0, 3).map(i => i.name).join(", ")}${outOf.length > 3 ? "..." : ""}`;
    if (low.length > 0) reply += `\n🟡 Low stock (${low.length}): ${low.slice(0, 3).map(i => i.name).join(", ")}${low.length > 3 ? "..." : ""}`;
    if (outOf.length === 0 && low.length === 0) reply += "\n✅ Sab items ka stock theek hai!";
    return reply;
  }

  // Sales / revenue query
  if (/sale|sales|revenue|aaj|today|kitna kamaya|income|bikri/.test(t)) {
    const bills = storage.getBills().filter(b => b.status !== "cancelled");
    const today = new Date();
    const todayBills = bills.filter(b => {
      const d = new Date(b.createdAt);
      return d.toDateString() === today.toDateString();
    });
    const monthBills = bills.filter(b => {
      const d = new Date(b.createdAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const todayRev = todayBills.reduce((s, b) => s + b.total, 0);
    const monthRev = monthBills.reduce((s, b) => s + b.total, 0);
    const settings = storage.getSettings();
    return `💰 Sales Summary:\n\n📅 Aaj: ${formatCurrency(todayRev, settings.currency)} (${todayBills.length} bills)\n📆 Is mahine: ${formatCurrency(monthRev, settings.currency)} (${monthBills.length} bills)\n\nPoori detail ke liye Reports page dekhein! 📊`;
  }

  // Profit query
  if (/profit|margin|kamaai|fayda|gross/.test(t)) {
    const bills = storage.getBills().filter(b => b.status !== "cancelled");
    const inv = storage.getInventory();
    const invMap = new Map(inv.map(i => [i.id, i]));
    const totalRev = bills.reduce((s, b) => s + b.total, 0);
    const totalCost = bills.reduce((acc, bill) => acc + bill.items.reduce((s, item) => {
      const invItem = item.productId ? invMap.get(item.productId) : null;
      return s + (invItem ? invItem.costPrice * item.qty : 0);
    }, 0), 0);
    const profit = totalRev - totalCost;
    const margin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : "0";
    const settings = storage.getSettings();
    return `📊 Profit Summary (All Time):\n\nTotal Revenue: ${formatCurrency(totalRev, settings.currency)}\nTotal Cost: ${formatCurrency(totalCost, settings.currency)}\nGross Profit: ${formatCurrency(profit, settings.currency)}\nMargin: ${margin}%\n\nPoori financial health ke liye Reports page check karein!`;
  }

  // Billing / add item navigation
  if (/bill|billing|add item|naya bill|invoice/.test(t)) {
    return `Naya bill banana ke liye Billing Terminal page par jaayein! 🧾\n\nWahan aap:\n• Item search karke add kar sakte hain\n• GST toggle kar sakte hain\n• Customer ka naam save kar sakte hain\n• UPI / Cash / Udhaar mein payment le sakte hain`;
  }

  // Khata / udhaar query
  if (/khata|udhaar|credit|customer|ledger|baki/.test(t)) {
    const transactions = storage.getTransactions();
    const customers = storage.getCustomers();
    const settings = storage.getSettings();
    let totalUdhaar = 0;
    customers.forEach(c => {
      const txns = transactions.filter(t => t.customerId === c.id);
      const bal = txns.reduce((s, t) => t.type === "udhaar" ? s + t.amount : s - t.amount, 0);
      if (bal > 0) totalUdhaar += bal;
    });
    const debtors = customers.filter(c => {
      const bal = transactions.filter(t => t.customerId === c.id)
        .reduce((s, t) => t.type === "udhaar" ? s + t.amount : s - t.amount, 0);
      return bal > 0;
    });
    return `📖 Khata Summary:\n\n${debtors.length} customers ka udhaar pending hai.\nKul baki: ${formatCurrency(totalUdhaar, settings.currency)}\n\nPoori detail ke liye Khata Ledger page dekhein!`;
  }

  // Bug report / complaint / email
  if (/bug|complaint|problem|issue|report|email|developer|contact|sampark/.test(t)) {
    const subject = encodeURIComponent("BMS Support Request");
    const body = encodeURIComponent(
      `Hi BMS Support Team,\n\nI would like to report an issue:\n\n[Please describe your problem here]\n\nApp: BMS - Business Management System\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nThank you.`
    );
    return `📧 Zaroor! Developer ko email karenge.\n\nNeeche diye link par click karein:\n\n[Send Email to Developer](mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body})\n\nSupport email: ${SUPPORT_EMAIL}\n\nAapki problem solve karne ki poori koshish ki jaayegi! 🙏`;
  }

  // Default fallback
  return `Hmm, samjha nahi bilkul. 😅\n\nKuch aise poochh sakte hain:\n• "Stock kitna hai?"\n• "Aaj ki sale?"\n• "Mera profit?"\n• "Udhaar kitna hai?"\n• "Bug report karna hai"\n\nKuch aur chahiye? Bataaiye!`;
}

function renderMessageText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Render markdown-style links [text](url)
    const linkMatch = line.match(/\[(.+?)\]\((mailto:.+?)\)/);
    if (linkMatch) {
      return (
        <p key={i} className="mb-0.5">
          <a href={linkMatch[2]} className="text-primary underline font-semibold" target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        </p>
      );
    }
    return <p key={i} className={line === "" ? "h-2" : "mb-0.5"}>{line}</p>;
  });
}

export function AiAssistant() {
  const { settings } = useShopSettings();
  const aiName = settings.aiName || "Paras";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: `Namaste! 🙏 Main ${aiName} hoon — aapka BMS assistant.\n\nKuch poochhna ho to likhein!` }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", text };
    const reply: Message = { role: "assistant", text: processMessage(text, aiName) };
    setMessages(prev => [...prev, userMsg, reply]);
    setInput("");
  };

  if (!settings.aiEnabled) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-13 h-13 w-[52px] h-[52px] rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
          title={`Chat with ${aiName}`}
        >
          <Bot size={22} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[360px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-none">{aiName}</p>
              <p className="text-xs text-white/75 mt-0.5">BMS AI Assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <Minimize2 size={15} />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}>
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Poochho kuch bhi..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all min-w-0"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
