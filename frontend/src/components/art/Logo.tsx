import { cx } from "../../lib/format";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#17151C" />
      <path d="M41.5 20.8a15 15 0 1 1-19 0" fill="none" stroke="#D4FF3A" strokeWidth="6" strokeLinecap="round" />
      <path d="M28 24.5v15.5l12.5-7.75z" fill="#D4FF3A" stroke="#D4FF3A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="display text-[1.35rem] leading-none whitespace-nowrap">Game-On</span>}
    </span>
  );
}
