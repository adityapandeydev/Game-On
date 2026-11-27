import type { ReactNode } from "react";
import { cx } from "../../lib/format";

/** Placeholder block shown while data loads. Pulses only while mounted. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-surface-3/70", className)} />;
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line-soft px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border-2 border-line bg-surface-2 text-ink-2">{icon}</div>
      <div>
        <p className="display-tight text-lg">{title}</p>
        {body && <p className="mt-1 max-w-sm text-sm text-ink-2">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="num inline-grid min-w-6 place-items-center rounded-md border-2 border-b-4 border-line-soft bg-surface px-1.5 text-[0.7rem] leading-5 font-semibold text-ink-2">
      {children}
    </kbd>
  );
}

/** A small stat tile: caps label over a mono figure. */
export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-1 rounded-2xl border-2 border-line bg-surface px-3.5 py-2.5", className)}>
      <span className="label-caps text-ink-3">{label}</span>
      <span className="num text-xl font-bold">{value}</span>
    </div>
  );
}
