import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { fmt } from "../../lib/format";

/**
 * Counts up to `value` once. It writes straight to the DOM node, so the tween
 * never re-renders React, and it stops when it reaches the value.
 */
export function Counter({ value, from = 0, duration = 0.9, className }: { value: number; from?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    const c = animate(from, value, { duration, ease: [0.2, 0.9, 0.1, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => c.stop();
  }, [value, from, duration, reduce]);
  return (
    <span ref={ref} className={className}>
      {fmt(from)}
    </span>
  );
}
