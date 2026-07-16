import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Mic, MicOff, CheckCircle, XCircle, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { storage, formatCurrency } from "@/lib/storage";
import { useShopSettings } from "@/lib/useShopSettings";
import { toast } from "sonner";

const SUPPORT_EMAIL = "bms0businessmanagementsystem@gmail.com";
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasSpeech = Boolean(SpeechRecognitionAPI);

type ActionType = "navigate" | "addBillItem" | "addNewProduct" | "logUdhaar";

type PendingAction = {
  type: ActionType;
  params: Record<string, string | number>;
  summary: string;
};

type TextMsg  = { id: string; kind: "text";   role: "assistant" | "user"; text: string };
type ActionMsg = { id: string; kind: "action"; role: "assistant"; action: PendingAction; prompt: string };
type Msg = TextMsg | ActionMsg;

const uid = () => Math.random().toString(36).slice(2, 9);

// ── NLP Action Parser ─────────────────────────────────────────────────────────
function parseAction(text: string): PendingAction | null {
  // 1. Navigate
  const navMatch = text.match(
    /(?:jaao?|jao|chalo|kholo|le chalo|open|dikhao|go to|take me to|show me?)\s+(.+?)(?:\s+page)?[\.\!\?]?\s*$/i
  );
  if (navMatch) {
    const dest = navMatch[1].trim().toLowerCase();
    const NAV: [string[], string, string][] = [
      [["billing", "bill", "naya bill", "new bill", "billing terminal"], "/billing", "Billing Terminal"],
      [["inventory", "stock", "maal", "saman", "products", "product"], "/inventory", "Inventory"],
      [["report", "analytics", "financial", "profit", "sales report"], "/reports", "Reports"],
      [["khata", "ledger", "udhaar", "credit", "khate"], "/khata", "Khata Ledger"],
      [["invoices", "invoice", "history", "bills list"], "/invoices", "Invoices"],
      [["help", "support"], "/help", "Help & Support"],
    ];
    for (const [kws, path, label] of NAV) {
      if (kws.some(k => dest.includes(k))) {
        return { type: "navigate", params: { path, label }, summary: `Open ${label} page` };
      }
    }
  }

  // 2. Log Udhaar: "Ramesh ka 500 ka udhaar likho" / "Sita ke 250 udhaar daalo"
  const u1 = text.match(
    /([a-z\u0900-\u097F][a-z\u0900-\u097F\s]{1,30}?)\s+(?:ka|ke|ki)\s+(?:₹|rs\.?|rp\.?|rupees?)?\s*(\d+(?:[.,]\d+)?)\s*(?:(?:ka|ke|ki)\s+)?(?:udhaar|udhar|credit|karza)/i
  );
  const u2 = text.match(
    /(?:udhaar|udhar|credit)\s+(?:likho|daalo|add karo|log karo|note karo)\s+([a-z\u0900-\u097F][a-z\u0900-\u097F\s]{1,30}?)\s+(?:₹|rs\.?|rupees?)?\s*(\d+(?:[.,]\d+)?)/i
  );
  const um = u1 || u2;
  if (um) {
    const customerName = um[1].trim();
    const amount = parseFloat(um[2].replace(",", "."));
    if (customerName.length >= 2 && amount > 0) {
      return {
        type: "logUdhaar",
        params: { customerName, amount },
        summary: `"${customerName}" ke khate mein ₹${amount} udhaar likhein`,
      };
    }
  }

  // 3. Add New Product: "naya product Chai khareed 10 bech 15 qty 100"
  const pm = text.match(
    /(?:add|add karo|naya|new)\s+(?:product|item|maal|saman)?\s*["']?([^"'\n]+?)["']?\s+(?:khareed(?:d?)?|cost|buying|purchase|lagat)\s+(?:price\s+)?(?:₹|rs\.?|rupees?)?\s*(\d+(?:\.\d+)?)\s+(?:bech|sell|selling|rate|bikri|mrp)\s+(?:price\s+)?(?:₹|rs\.?|rupees?)?\s*(\d+(?:\.\d+)?)(?:\s+(?:qty|quantity|stock|stok|maal)\s+(\d+))?/i
  );
  if (pm) {
    const name = pm[1].trim();
    const costPrice = parseFloat(pm[2]);
    const sellingPrice = parseFloat(pm[3]);
    const stock = parseInt(pm[4] || "0") || 0;
    if (name.length >= 2 && costPrice > 0 && sellingPrice > 0) {
      return {
        type: "addNewProduct",
        params: { name, costPrice, sellingPrice, stock },
        summary: `Add "${name}" — Cost: ₹${costPrice}, Sell: ₹${sellingPrice}, Stock: ${stock}`,
      };
    }
  }

  // 4. Add to Bill: "Chai 2 bill mein add karo" / "add Biscuit x3 to bill"
  const b1 = text.match(/(.+?)\s+(?:x\s*|×\s*)?(\d+)\s+(?:bill mein|bill me|to bill|bill add|ko bill)/i);
  const b2 = text.match(/(?:bill mein|bill me|add to bill|bill add karo)\s+(.+?)(?:\s+(?:x\s*|×\s*)?(\d+))?[\.\!\?]?\s*$/i);
  const bm = b1 || b2;
  if (bm) {
    const itemName = bm[1].trim();
    const qty = parseInt(bm[2] || "1") || 1;
    if (itemName.length >= 2 && !/^(bill|add|karo|please|mein|me)$/i.test(itemName)) {
      return {
        type: "addBillItem",
        params: { itemName, qty },
        summary: `"${itemName}" × ${qty} current bill mein add karein`,
      };
    }
  }

  // 5. "Add karo" product by name only (no price) — navigate to inventory with name prefilled
  const nameOnlyMatch = text.match(
    /(?:add|add karo|naya|new|inventory mein)\s+(?:product|item|maal|saman)?\s*["']?([^"'\n]{2,40})["']?\s+(?:add karo|stock mein|inventory mein|daalo)?[\.\!\?]?\s*$/i
  );
  if (nameOnlyMatch) {
    const name = nameOnlyMatch[1].trim();
    if (name.length >= 2 && !/^(karo|please|add|naya|new|product|item|inventory)$/i.test(name)) {
      return {
        type: "addNewProduct",
        params: { name, costPrice: 0, sellingPrice: 0, stock: 0 },
        summary: `Open Inventory and pre-fill product name "${name}"`,
      };
    }
  }

  return null;
}

// ── Rule-based text responses ─────────────────────────────────────────────────
function getTextResponse(text: string, aiName: string): string {
  const t = text.toLowerCase().trim();

  if (/^(hi|hello|namaste|halo|hey|namaskar|jai|ram ram|radhe|sat sri akal)\b/.test(t)) {
    return `Namaste! 🙏 Main **${aiName}** hoon — aapka BMS AI assistant.\n\nPooch sakte hain ya bol sakte hain:\n• "Stock kitna hai?"\n• "Aaj ki sale?"\n• "Reports kholo"\n• "Ramesh ka ₹500 udhaar likho"\n• "Naya product Chai khareed 10 bech 15 qty 50"\n\n🎤 Mic button se voice mein bhi bol sakte hain!`;
  }

  if (/help|kya kar|madad|features|capabilities|kya karta|functions/.test(t)) {
    return `Main **${aiName}** hoon — ek powerful BMS assistant! 🚀\n\n**Ye kaam kar sakta hoon:**\n📦 Stock aur inventory check karna\n💰 Sales aur revenue summary batana\n📊 Profit margin estimate karna\n📖 Khata/Udhaar balance batana\n🗂️ Kisi bhi page par navigate karna\n✍️ Naya product form pre-fill karna\n🧾 Bill item search pre-fill karna\n📝 Udhaar log karna\n\n🎤 **Voice bhi support karta hoon!** Mic dabao aur Hindi/English/Hinglish mein bolo.`;
  }

  if (/stock|inventory|items|products|maal|saman|kitna stok/.test(t)) {
    const inv = storage.getInventory();
    if (inv.length === 0) return "Abhi inventory mein koi item nahi hai. Inventory page par jaakar products add karein! 📦";
    const outOf = inv.filter(i => i.stock === 0);
    const low = inv.filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold);
    let r = `📦 Aapke paas **${inv.length} products** hain.\n`;
    if (outOf.length > 0) r += `\n🔴 Out of stock (${outOf.length}): ${outOf.slice(0, 3).map(i => i.name).join(", ")}${outOf.length > 3 ? "…" : ""}`;
    if (low.length > 0) r += `\n🟡 Low stock (${low.length}): ${low.slice(0, 3).map(i => i.name).join(", ")}${low.length > 3 ? "…" : ""}`;
    if (outOf.length === 0 && low.length === 0) r += "\n✅ Sab items ka stock theek hai!";
    return r;
  }

  if (/sale|sales|revenue|aaj|today|kitna kamaya|income|bikri|collection/.test(t)) {
    const bills = storage.getBills().filter(b => b.status !== "cancelled");
    const today = new Date();
    const todayBills = bills.filter(b => new Date(b.createdAt).toDateString() === today.toDateString());
    const monthBills = bills.filter(b => {
      const d = new Date(b.createdAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const { currency } = storage.getSettings();
    const todayRev = todayBills.reduce((s, b) => s + b.total, 0);
    const monthRev = monthBills.reduce((s, b) => s + b.total, 0);
    const todayCash = todayBills.filter(b => b.paymentMethod === "cash").reduce((s, b) => s + b.total, 0);
    const todayUpi = todayBills.filter(b => ["upi", "card"].includes(b.paymentMethod)).reduce((s, b) => s + b.total, 0);
    const todayUdhaar = todayBills.filter(b => b.paymentMethod === "credit").reduce((s, b) => s + b.total, 0);
    return `💰 **Sales Summary:**\n\n📅 Aaj: **${formatCurrency(todayRev, currency)}** (${todayBills.length} bills)\n   Cash: ${formatCurrency(todayCash, currency)} · UPI/Card: ${formatCurrency(todayUpi, currency)} · Udhaar: ${formatCurrency(todayUdhaar, currency)}\n\n📆 Is mahine: **${formatCurrency(monthRev, currency)}** (${monthBills.length} bills)\n\nPoori detail ke liye "Reports kholo" bol sakte hain! 📊`;
  }

  if (/profit|margin|kamaai|fayda|gross|net/.test(t)) {
    const bills = storage.getBills().filter(b => b.status !== "cancelled");
    const inv = storage.getInventory();
    const invMap = new Map(inv.map(i => [i.id, i]));
    const { currency } = storage.getSettings();
    const totalRev = bills.reduce((s, b) => s + b.total, 0);
    const totalCost = bills.reduce((acc, b) => acc + b.items.reduce((s, item) => {
      const inv = item.productId ? invMap.get(item.productId) : null;
      return s + (inv ? inv.costPrice * item.qty : 0);
    }, 0), 0);
    const profit = totalRev - totalCost;
    const margin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : "0";
    return `📊 **Profit Summary (All Time):**\n\nRevenue: ${formatCurrency(totalRev, currency)}\nCost: ${formatCurrency(totalCost, currency)}\nProfit: **${formatCurrency(profit, currency)}**\nMargin: **${margin}%**\n\nPoori detail ke liye "Reports kholo" kahiye!`;
  }

  if (/khata|udhaar|credit|customer|ledger|baki|balance|outstanding/.test(t)) {
    const txns = storage.getTransactions();
    const custs = storage.getCustomers();
    const { currency } = storage.getSettings();
    let total = 0;
    const debtors: Array<{ name: string; bal: number }> = [];
    custs.forEach(c => {
      const bal = txns.filter(t => t.customerId === c.id).reduce((s, t) => t.type === "udhaar" ? s + t.amount : s - t.amount, 0);
      if (bal > 0) { total += bal; debtors.push({ name: c.name, bal }); }
    });
    debtors.sort((a, b) => b.bal - a.bal);
    let r = `📖 **Khata Summary:**\n\n${debtors.length} customers ka udhaar pending hai.\nKul baki: **${formatCurrency(total, currency)}**`;
    if (debtors.length > 0) r += `\n\nTop debtors:\n${debtors.slice(0, 3).map(d => `• ${d.name}: ${formatCurrency(d.bal, currency)}`).join("\n")}`;
    return r;
  }

  if (/bug|complaint|problem|issue|report|email|developer|contact|sampark/.test(t)) {
    const subj = encodeURIComponent("BMS Support Request");
    const body = encodeURIComponent(`Hi BMS Support Team,\n\nI have a question/issue:\n\n[Please describe here]\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nThank you.`);
    return `📧 Developer ko email karein:\n\n[Support Email bhejein](mailto:${SUPPORT_EMAIL}?subject=${subj}&body=${body})\n\n${SUPPORT_EMAIL}`;
  }

  return `Hmm, yeh samjha nahi bilkul. 😅\n\nKuch aise try karein:\n• "Aaj ki sale batao"\n• "Ramesh ka 500 udhaar likho"\n• "Reports page kholo"\n• "Stock kitna hai?"\n• "Naya product Chai khareed 10 bech 15 qty 50"\n\n🎤 Ya mic button se Hindi/Hinglish mein bol sakte hain!`;
}

// ── Render text with **bold** and [link](url) ──────────────────────────────────
function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    const linkRe = /\[(.+?)\]\((mailto:[^)]+)\)/g;
    if (linkRe.test(line)) {
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      line.replace(/\[(.+?)\]\((mailto:[^)]+)\)/g, (match, label, href, offset) => {
        if (offset > lastIdx) parts.push(line.slice(lastIdx, offset));
        parts.push(<a key={offset} href={href} className="text-primary underline font-semibold" target="_blank" rel="noopener noreferrer">{label}</a>);
        lastIdx = offset + match.length;
        return match;
      });
      if (lastIdx < line.length) parts.push(line.slice(lastIdx));
      return <p key={i} className={line === "" ? "h-1" : "mb-0.5"}>{parts}</p>;
    }
    const boldParts = line.split(/\*\*(.+?)\*\*/g);
    const rendered = boldParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    return <p key={i} className={line === "" ? "h-1" : "mb-0.5"}>{rendered}</p>;
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export function AiAssistant() {
  const { settings } = useShopSettings();
  const [, navigate] = useLocation();
  const aiName = settings.aiName || "Paras";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    id: uid(), kind: "text", role: "assistant",
    text: `Namaste! 🙏 Main **${aiName}** hoon — aapka BMS AI assistant.\n\nPooch sakte hain ya bol sakte hain:\n• "Stock kitna hai?"\n• "Aaj ki sale?"\n• "Reports kholo"\n• "Ramesh ka ₹500 udhaar likho"\n\n🎤 Mic se voice input bhi kar sakte hain!`,
  }]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const addMsg = useCallback((msg: Omit<TextMsg, "id"> | Omit<ActionMsg, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: uid() } as Msg]);
  }, []);

  const executeAction = useCallback((action: PendingAction) => {
    const label = (action.params.label as string) ?? action.params.path;
    if (action.type === "navigate") {
      navigate(action.params.path as string);
      addMsg({ kind: "text", role: "assistant", text: `✅ **${label}** page par le gaya hoon! 🎯` });
    } else if (action.type === "addBillItem") {
      navigate("/billing");
      setTimeout(() => window.dispatchEvent(new CustomEvent("ai-prefill-bill-item", { detail: action.params })), 450);
      addMsg({ kind: "text", role: "assistant", text: `✅ **Billing Terminal** mein "${action.params.itemName}" × ${action.params.qty} pre-fill kar diya!\nItem select karein aur "Add to Bill" dabayein. 🧾` });
    } else if (action.type === "addNewProduct") {
      navigate("/inventory");
      setTimeout(() => window.dispatchEvent(new CustomEvent("ai-prefill-product", { detail: action.params })), 450);
      addMsg({ kind: "text", role: "assistant", text: `✅ **Inventory** mein "${action.params.name}" ka form khola!\nDetails check karein aur "Save" dabayein. 📦` });
    } else if (action.type === "logUdhaar") {
      navigate("/khata");
      setTimeout(() => window.dispatchEvent(new CustomEvent("ai-prefill-udhaar", { detail: action.params })), 450);
      addMsg({ kind: "text", role: "assistant", text: `✅ **Khata Ledger** mein "${action.params.customerName}" ka ₹${action.params.amount} udhaar form khola!\n"Log Udhaar" dabayein. 📖` });
    }
  }, [navigate, addMsg]);

  const sendText = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    addMsg({ kind: "text", role: "user", text: t });
    setInput("");
    const action = parseAction(t);
    setTimeout(() => {
      if (action) {
        addMsg({ kind: "action", role: "assistant", action, prompt: "Kya main yeh karo? 🤔" } as Omit<ActionMsg, "id">);
      } else {
        addMsg({ kind: "text", role: "assistant", text: getTextResponse(t, aiName) });
      }
    }, 300);
  }, [addMsg, aiName]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (!hasSpeech) { toast("Voice input Chrome browser mein best kaam karta hai. 🎤"); return; }
    try {
      const rec = new SpeechRecognitionAPI();
      rec.lang = "hi-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        setIsListening(false);
        sendText(e.results[0][0].transcript);
      };
      rec.onerror = (e: any) => {
        setIsListening(false);
        if (e.error !== "no-speech" && e.error !== "aborted") toast("Voice error: " + e.error + ". Chrome mein try karein.");
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch { toast("Voice not supported. Chrome mein try karein."); }
  }, [isListening, sendText]);

  if (!settings.aiEnabled) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-[52px] h-[52px] rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
          title={`Chat with ${aiName}`}
        >
          <Bot size={22} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[370px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-none">{aiName}</p>
              <p className="text-xs text-white/75 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                BMS AI · Voice + Actions
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map(msg => {
              if (msg.kind === "action") {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[90%] bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/20 rounded-2xl rounded-bl-sm p-3 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-500">{msg.prompt}</p>
                      <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                        <div className="flex items-start gap-2">
                          <Zap size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">{msg.action.summary}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeAction(msg.action)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                        >
                          <CheckCircle size={13} /> Kar Do ✓
                        </button>
                        <button
                          onClick={() => addMsg({ kind: "text", role: "assistant", text: "Theek hai, koi baat nahi! Kuch aur kaam ho to batayein. 😊" })}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    {renderText(msg.text)}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={toggleVoice}
              title={isListening ? "Stop listening" : "Voice input (Hindi / English / Hinglish)"}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                  : hasSpeech
                    ? "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary"
                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
              }`}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendText(input); }}
              placeholder={isListening ? "🎤 Sun raha hoon…" : "Poochho kuch bhi…"}
              disabled={isListening}
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all min-w-0 disabled:opacity-60"
            />
            <button
              onClick={() => sendText(input)}
              disabled={!input.trim() || isListening}
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          {isListening && (
            <p className="text-center text-xs text-red-500 font-semibold pb-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              Hindi, English, ya Hinglish mein bolein…
            </p>
          )}
        </div>
      )}
    </>
  );
}
