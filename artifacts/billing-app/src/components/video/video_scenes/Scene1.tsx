import { motion } from "framer-motion";
import { ArrowUpRight, WifiOff, Zap } from "lucide-react";

export function Scene1() {
  return (
    <motion.div
      className="bms-scene bms-scene-one"
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, clipPath: "inset(0 0 0% 100%)" }}
      transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="bms-scene-copy bms-copy-intro">
        <motion.div
          className="bms-eyebrow"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.22, duration: 0.42 }}
        >
          <span className="bms-eyebrow-dot" />
          Built for the shop counter
        </motion.div>
        <motion.h2
          className="bms-headline"
          initial={{ opacity: 0, y: 34, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.38, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          Billing that
          <br />
          <em>keeps up.</em>
        </motion.h2>
        <motion.p
          className="bms-scene-voice"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.5 }}
        >
          Tired of complicated billing software? Meet BMS—a lightweight system
          designed for local retail shops.
        </motion.p>
        <motion.div
          className="bms-feature-stamp"
          initial={{ opacity: 0, scale: 0.78, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -4 }}
          transition={{ delay: 1.35, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Zap size={14} strokeWidth={2.5} />
          <span>Offline-first</span>
        </motion.div>
      </div>

      <motion.div
        className="bms-mockup-shell bms-dashboard-mockup"
        initial={{ opacity: 0, y: 48, rotate: 3, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, rotate: -2.5, scale: 1 }}
        transition={{ delay: 0.58, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bms-recording-label">Screen recording placeholder</div>
        <div className="bms-browser-bar">
          <div className="bms-browser-dots"><i /><i /><i /></div>
          <span className="bms-browser-url">bms.local / dashboard</span>
          <span className="bms-browser-lock">LOCAL</span>
        </div>
        <div className="bms-dashboard-body">
          <aside className="bms-mini-sidebar">
            <div className="bms-mini-mark">B</div>
            <div className="bms-mini-nav active"><span /><span /></div>
            <div className="bms-mini-nav"><span /><span /></div>
            <div className="bms-mini-nav"><span /><span /></div>
            <div className="bms-mini-nav"><span /><span /></div>
            <div className="bms-mini-nav bottom"><span /><span /></div>
          </aside>
          <div className="bms-dashboard-content">
            <div className="bms-dash-topline">
              <div><small>Good morning, Riya</small><strong>Your shop at a glance</strong></div>
              <span className="bms-live-chip"><WifiOff size={10} /> Local mode</span>
            </div>
            <div className="bms-stat-grid">
              <div className="bms-stat-card accent"><small>Today&apos;s sales</small><strong>₹18,420</strong><span>+12.6% this week</span></div>
              <div className="bms-stat-card"><small>Open Khata</small><strong>₹7,840</strong><span>8 customers</span></div>
              <div className="bms-stat-card"><small>Items low in stock</small><strong>06</strong><span>Needs attention</span></div>
            </div>
            <div className="bms-dash-lower">
              <div className="bms-chart-card"><div className="bms-skeleton-title" /><div className="bms-chart-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
              <div className="bms-quick-card"><small>Quick billing</small><strong>New invoice</strong><div className="bms-quick-arrow"><ArrowUpRight size={15} /></div></div>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="bms-scene-index"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <span>01</span><i /><span>04</span>
      </motion.div>
    </motion.div>
  );
}