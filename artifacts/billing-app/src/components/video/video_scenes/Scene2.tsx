import { motion } from "framer-motion";
import { Check, IndianRupee, ReceiptText, ToggleRight } from "lucide-react";

export function Scene2() {
  return (
    <motion.div
      className="bms-scene bms-scene-two"
      initial={{ opacity: 0, clipPath: "circle(0% at 86% 16%)" }}
      animate={{ opacity: 1, clipPath: "circle(150% at 86% 16%)" }}
      exit={{ opacity: 0, clipPath: "circle(0% at 12% 80%)" }}
      transition={{ duration: 0.88, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bms-scene-copy bms-copy-billing">
        <motion.div className="bms-eyebrow" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <span className="bms-eyebrow-dot coral" />
          Billing &amp; GST
        </motion.div>
        <motion.h2 className="bms-headline compact" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.62 }}>
          Tap. Print.
          <br /><em>Done.</em>
        </motion.h2>
        <motion.p className="bms-scene-voice" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.45 }}>
          Generate fast GST or Non-GST invoices in Rupees or Dollars with just a few taps.
        </motion.p>
        <motion.div className="bms-pill-row" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.12, duration: 0.4 }}>
          <span><ReceiptText size={13} /> GST-ready</span>
          <span><IndianRupee size={13} /> Multi-currency</span>
        </motion.div>
      </div>

      <motion.div
        className="bms-mockup-shell bms-billing-mockup"
        initial={{ opacity: 0, x: 56, rotate: 2.6, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, rotate: 1.3, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bms-recording-label coral-label">Replace with billing screen recording</div>
        <div className="bms-browser-bar">
          <div className="bms-browser-dots"><i /><i /><i /></div>
          <span className="bms-browser-url">bms.local / billing</span>
          <span className="bms-browser-lock">LOCAL</span>
        </div>
        <div className="bms-billing-body">
          <div className="bms-billing-head"><div><small>New invoice</small><strong>INV-240821</strong></div><span className="bms-draft">Draft</span></div>
          <div className="bms-toggle-line"><span>Tax mode</span><div className="bms-gst-toggle"><b>GST</b><span>Non-GST</span><ToggleRight size={21} /></div></div>
          <div className="bms-items">
            <div className="bms-item-row"><span className="bms-item-icon">A</span><div><strong>Almond biscuits</strong><small>2 × ₹68.00</small></div><b>₹136.00</b></div>
            <div className="bms-item-row"><span className="bms-item-icon blue">T</span><div><strong>Tea leaves · 500g</strong><small>1 × ₹245.00</small></div><b>₹245.00</b></div>
            <div className="bms-item-row"><span className="bms-item-icon yellow">S</span><div><strong>Sunflower oil · 1L</strong><small>1 × ₹142.00</small></div><b>₹142.00</b></div>
          </div>
          <div className="bms-total-row"><span>Subtotal <small>GST 5%</small></span><strong>₹523.15</strong></div>
          <div className="bms-billing-actions"><span><Check size={13} /> Saved locally</span><span className="bms-fake-button">Create invoice <span>→</span></span></div>
        </div>
      </motion.div>
      <motion.div className="bms-tap-orbit" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1, 1.2, 1.4] }} transition={{ delay: 1.7, duration: 1.6, repeat: 1 }}>
        <span />
      </motion.div>
      <div className="bms-scene-index"><span>02</span><i /><span>04</span></div>
    </motion.div>
  );
}