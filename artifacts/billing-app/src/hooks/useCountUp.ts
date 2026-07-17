import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Smoothly animates a numeric value toward `target`.
 * Re-animates from the current displayed value whenever `target` changes.
 */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  const rafRef  = useRef(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    cancelAnimationFrame(rafRef.current);
    let startTs: number | null = null;

    function step(ts: number) {
      if (startTs === null) startTs = ts;
      const t    = Math.min((ts - startTs) / duration, 1);
      const next = from + (target - from) * easeOutCubic(t);
      fromRef.current = next;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}
