import { motion } from "framer-motion";
import { ArrowDownRight, BookOpen, Boxes, TrendingUp } from "lucide-react";

export function Scene3() {
  return (
    <motion.div
      className="bms-scene bms-scene-three"
      initial={{ opacity: 0, clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)" }}
      animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      exit={{ opacity: 0, clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
      transition={{ duration: 0.86, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bms-scene-copy bms-copy-ledger">
        <motion.div className="bms-eyebrow" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
          <span className="bms-eyebrow-dot olive" />
          Khata + Inventory
        </motion.div>
        <motion.h2 className="bms-headline compact" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33, duration: 0.62 }}>
          Know what&apos;s
          <br /><em>moving.</em>
        </motion.h2>
        <motion.p className="bms-scene-voice" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.73, duration: 0.45 }}>
          Track customer Udhaar balances, manage real-time inventory, and monitor your profit instantly.
        </motion.p>
        <motion.div className="bms-insight-list" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.08, duration: 0.5 }}>
          <span><BookOpen size={13} /> Udhaar stays visible</span>
          <span><Boxes size={13} /> Stock stays honest</span>
          <span><TrendingUp size={13} /> Profit stays clear</span>
        </motion.div>
      </div>

      <motion.div
        className="bms-mockup-shell bms-ledger-mockup"
        initial={{ opacity: 0, y: 42, rotate: -2, scale: 0.91 }}
        animate={{ opacity: 1, y: 0, rotate: -1.3, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.92, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bms-recording-label olive-label">Replace with Khata + inventory recording</div>
        <div className="bms-browser-bar">
          <div className="bms-browser-dots"><i /><i /><i /></div>
          <span className="bms-browser-url">bms.local / reports</span>
          <span className="bms-browser-lock">LOCAL</span>
        </div>
        <div className="bms-report-body">
          <div className="bms-report-head"><div><small>This month</small><strong>Shop pulse</strong></div><span className="bms-date-chip">Aug 01 — Aug 31</span></div>
          <div className="bms-report-stats">
            <div><small>Receivables</small><strong>₹7,840</strong><span className="down"><ArrowDownRight size={12} /> 8 customers</span></div>
            <div><small>Gross profit</small><strong>₹26,184</strong><span className="up"><TrendingUp size={12} /> 18.4%</span></div>
          </div>
          <div className="bms-report-columns">
            <div className="bms-ledger-panel"><div className="bms-panel-title"><span>Udhaar ledger</span><b>View all</b></div><div className="bms-ledger-entry"><span className="bms-avatar peach">AS</span><div><strong>Anita Stores</strong><small>Due 02 Sep</small></div><b>₹2,450</b></div><div className="bms-ledger-entry"><span className="bms-avatar lavender">RK</span><div><strong>Rakesh Kumar</strong><small>Due 08 Sep</small></div><b>₹1,120</b></div><div className="bms-ledger-entry"><span className="bms-avatar mint">MP</span><div><strong>Meena Pharmacy</strong><small>Due today</small></div><b>₹860</b></div></div>
            <div className="bms-stock-panel"><div className="bms-panel-title"><span>Stock watch</span><b>6 low</b></div><div className="bms-stock-line"><span>Tea leaves</span><i><b style={{ width: "28%" }} /></i><strong>12</strong></div><div className="bms-stock-line"><span>Almond biscuits</span><i><b style={{ width: "43%" }} /></i><strong>19</strong></div><div className="bms-stock-line"><span>Sunflower oil</span><i><b style={{ width: "17%" }} /></i><strong>06</strong></div></div>
          </div>
        </div>
      </motion.div>
      <div className="bms-scene-index"><span>03</span><i /><span>04</span></div>
    </motion.div>
  );
}