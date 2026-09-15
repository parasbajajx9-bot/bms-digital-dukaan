import { motion } from "framer-motion";
import { Check, Printer, Share2, ShieldCheck } from "lucide-react";

export function Scene4() {
  return (
    <motion.div
      className="bms-scene bms-scene-four"
      initial={{ opacity: 0, scale: 0.95, clipPath: "inset(50% 0 50% 0)" }}
      animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0 0% 0)" }}
      exit={{ opacity: 0, scale: 1.05, clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bms-cta-grain" />
      <motion.div className="bms-cta-copy" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.7 }}>
        <div className="bms-cta-kicker"><span className="bms-eyebrow-dot coral" /> Your counter, more capable</div>
        <h2 className="bms-cta-title">Digitize your<br /><em>shop today with BMS!</em></h2>
        <p>Simple tools. Local control. More time for customers.</p>
        <div className="bms-cta-signoff"><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="BMS shop logo" /><span>BMS — Business Management System</span></div>
      </motion.div>
      <motion.div className="bms-receipt-stage" initial={{ opacity: 0, x: 60, rotate: 4, y: 20 }} animate={{ opacity: 1, x: 0, rotate: 3.4, y: 0 }} transition={{ delay: 0.46, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
        <div className="bms-receipt-card">
          <div className="bms-receipt-brand"><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="" /><strong>Riya General Store</strong><small>Thank you for shopping with us</small></div>
          <div className="bms-receipt-line" />
          <div className="bms-receipt-meta"><span>INV-240821</span><span>21 Aug 2024 · 10:42 AM</span></div>
          <div className="bms-receipt-item"><span>Almond biscuits × 2</span><b>₹136.00</b></div>
          <div className="bms-receipt-item"><span>Tea leaves · 500g</span><b>₹245.00</b></div>
          <div className="bms-receipt-item"><span>Sunflower oil · 1L</span><b>₹142.00</b></div>
          <div className="bms-receipt-total"><span>Total paid</span><strong>₹523.15</strong></div>
          <div className="bms-receipt-paid"><Check size={11} /> Paid via UPI</div>
          <div className="bms-receipt-barcode"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
        <div className="bms-output-tags"><span><Printer size={13} /> Print</span><span><Share2 size={13} /> Share</span></div>
      </motion.div>
      <motion.div className="bms-trust-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.18, duration: 0.5 }}><ShieldCheck size={14} /> Your data stays on your device.</motion.div>
      <div className="bms-loop-mark"><span>01</span><i /><span>04</span></div>
    </motion.div>
  );
}