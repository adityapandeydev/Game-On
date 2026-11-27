import type { ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { cx } from "../lib/format";

/** A row of live stat chips above a game board. Values roll vertically when they change. */
export function Hud({ items, className }: { items: { label: string; value: ReactNode; accent?: boolean }[]; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-stretch gap-2", className)}>
      {items.map((it) => (
        <div key={it.label} className={cx("flex min-w-20 flex-col rounded-xl border-2 border-line px-3 py-1.5", it.accent ? "bg-[var(--accent)] text-[#17151c]" : "bg-surface")}>
          <span className={cx("label-caps", it.accent ? "opacity-70" : "text-ink-3")}>{it.label}</span>
          <span className="relative h-6 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={String(it.value)}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 36 }}
                className="num block text-lg leading-6 font-bold"
              >
                {it.value}
              </m.span>
            </AnimatePresence>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Centres a game board in the available stage area with consistent padding. */
export function StageBody({ hud, children, footer }: { hud?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      {hud}
      <div className="grid min-h-0 flex-1 place-items-center">{children}</div>
      {footer}
    </div>
  );
}
