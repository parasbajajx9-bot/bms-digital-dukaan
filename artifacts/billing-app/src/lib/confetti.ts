const COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ec4899", "#ef4444", "#8b5cf6", "#14b8a6",
];
const GREEN_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#d1fae5"];

export function fireConfetti(opts?: { green?: boolean; originY?: number }) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:9999;pointer-events:none;width:100%;height:100%;";
  document.body.appendChild(canvas);

  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);
  const ctx = canvas.getContext("2d")!;
  const palette = opts?.green ? GREEN_COLORS : COLORS;
  const oy = H * (opts?.originY ?? 0.72);

  const particles = Array.from({ length: 90 }, () => ({
    x: W * 0.5,
    y: oy,
    vx: (Math.random() - 0.5) * 16,
    vy: -(Math.random() * 11 + 5),
    w: Math.random() * 8 + 3,
    h: Math.random() * 4 + 2,
    color: palette[Math.floor(Math.random() * palette.length)],
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 9,
  }));

  const DURATION = 1900;
  let start = 0;

  function frame(ts: number) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const progress = elapsed / DURATION;
    if (progress > 1) {
      document.body.removeChild(canvas);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.x += p.vx * 0.97;
      p.y += p.vy;
      p.vy += 0.3;
      p.rot += p.rv;
      const alpha = Math.max(0, 1 - progress * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
