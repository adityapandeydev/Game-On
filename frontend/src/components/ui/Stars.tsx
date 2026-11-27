import { useState } from "react";
import { m } from "motion/react";
import { Star } from "lucide-react";
import { cx } from "../../lib/format";

/** Read-only star display; supports fractional averages. */
export function StarRow({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cx("relative inline-flex", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      <span className="flex text-line-soft">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-[var(--a-amber)]" style={{ width: `${(value / 5) * 100}%` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

/** Interactive 1-5 rating. Stars pop in sequence when the value changes. */
export function StarInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: boolean }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= shown;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="grid size-11 place-items-center rounded-lg"
          >
            <m.span
              key={`${n}-${value}`}
              initial={value >= n ? { scale: 0.6, rotate: -20 } : false}
              animate={{ scale: on ? 1 : 0.92, rotate: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 16, delay: value >= n ? (n - 1) * 0.04 : 0 }}
              className={cx("transition-colors duration-150", on ? "text-[var(--a-amber)]" : error ? "text-danger/60" : "text-line-soft")}
            >
              <Star size={30} fill="currentColor" stroke="var(--line)" strokeWidth={1.6} />
            </m.span>
          </button>
        );
      })}
    </div>
  );
}
