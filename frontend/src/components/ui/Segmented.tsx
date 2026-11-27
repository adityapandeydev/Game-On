import { useId, type ReactNode } from "react";
import { m } from "motion/react";
import { cx } from "../../lib/format";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  hint?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** "pill" for filters on the page background, "inset" inside cards. */
  look?: "inset" | "pill";
}

const thumbSpring = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 } as const;

/**
 * Radio-group style selector. The selection thumb is a single shared layout
 * element that glides between options.
 */
export function Segmented<T extends string>({ options, value, onChange, label, size = "md", className, look = "inset" }: Props<T>) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        "relative inline-flex items-stretch gap-1 rounded-[14px] p-1",
        look === "inset" ? "border-2 border-line bg-surface-2" : "bg-transparent",
        className,
      )}
      onKeyDown={(e) => {
        const i = options.findIndex((o) => o.value === value);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(options[(i + 1) % options.length].value);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(options[(i - 1 + options.length) % options.length].value);
        }
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative z-0 flex-1 rounded-[10px] font-bold transition-colors duration-200",
              size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4",
              active ? "text-[#17151c]" : "text-ink-2 hover:text-ink",
            )}
          >
            {active && (
              <m.span
                layoutId={`seg-${id}`}
                transition={thumbSpring}
                className="absolute inset-0 -z-10 rounded-[10px] border-2 border-line bg-brand shadow-[2px_2px_0_var(--shadow)]"
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface TabsProps<T extends string> {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}

/** Underline tabs; the bar slides between tabs as one shared element. */
export function Tabs<T extends string>({ tabs, value, onChange, label, className }: TabsProps<T>) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={cx("scrollbar-none flex gap-1 overflow-x-auto border-b-2 border-line-soft", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cx(
              "relative -mb-[2px] inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-bold transition-colors duration-200",
              active ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {t.label}
            {active && (
              <m.span layoutId={`tab-${id}`} transition={thumbSpring} className="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-ink" />
            )}
          </button>
        );
      })}
    </div>
  );
}
