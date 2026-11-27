import { useLayoutEffect, useRef } from "react";
import { cx } from "../lib/format";

/**
 * A draining bar driven by one CSS transform transition to zero; the
 * compositor animates it and no JavaScript runs per frame.
 *
 * Pass `endsAt` (a performance.now() timestamp) when the deadline is known,
 * otherwise the bar runs the full `totalMs` from when `resetKey` changes.
 */
export function TimerBar({ totalMs, endsAt, running, resetKey, className }: { totalMs: number; endsAt?: number; running: boolean; resetKey: unknown; className?: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const remaining = endsAt === undefined ? totalMs : Math.max(0, endsAt - performance.now());
    el.style.transition = "none";
    el.style.transform = `scaleX(${running ? remaining / totalMs : endsAt === undefined ? 1 : 0})`;
    if (!running) return;
    void el.offsetWidth; // commit the start position before transitioning
    el.style.transition = `transform ${remaining}ms linear`;
    el.style.transform = "scaleX(0)";
  }, [resetKey, running, endsAt, totalMs]);
  return (
    <div className={cx("h-3 overflow-hidden rounded-full border-2 border-line bg-surface-2", className)}>
      <div ref={bar} className="h-full origin-left bg-[var(--accent)]" />
    </div>
  );
}
