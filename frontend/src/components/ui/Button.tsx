import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { cx } from "../../lib/format";
import { Spinner } from "./Spinner";

export type ButtonStatus = "idle" | "loading" | "success" | "error";
type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  variant?: Variant;
  size?: Size;
  status?: ButtonStatus;
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Shown in place of the label while status is "success". */
  doneLabel?: string;
  block?: boolean;
}

const base =
  "group relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap font-bold " +
  "border-2 border-line rounded-[var(--radius-btn)] " +
  // Physical press: the face lifts slightly on hover and sinks into its shadow when pressed.
  "transition-[transform,box-shadow,background-color,color] duration-150 ease-[var(--ease-snap)] " +
  "disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0";

const raised =
  "shadow-[3px_3px_0_var(--shadow)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--shadow)] " +
  "active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_var(--shadow)] active:duration-75";

const variants: Record<Variant, string> = {
  primary: `bg-brand text-[#17151c] ${raised}`,
  accent: `bg-[var(--accent)] text-on-accent ${raised}`,
  secondary: `bg-surface text-ink ${raised}`,
  danger: `bg-danger text-white ${raised}`,
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface-2 active:scale-[0.97]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-4.5 text-[0.95rem]",
  lg: "h-14 gap-2.5 px-6 text-lg display-tight",
};

const swap = {
  initial: { y: "110%", opacity: 0 },
  animate: { y: "0%", opacity: 1 },
  exit: { y: "-110%", opacity: 0 },
  transition: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 },
} as const;

/**
 * The single button used everywhere. Hover and press are pure CSS. Status
 * changes swap the content inside a fixed box (the label keeps its width, so
 * nothing reflows): loading slides a spinner in, success draws a check, error
 * shakes once.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", status = "idle", icon, iconRight, doneLabel, block, className, children, disabled, ...rest },
  ref,
) {
  const busy = status === "loading";
  return (
    <m.button
      ref={ref}
      className={cx(base, variants[variant], sizes[size], block && "w-full", status === "success" && "!bg-success !text-white", className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      animate={status === "error" ? { x: [0, -7, 7, -5, 5, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.42 }}
      {...rest}
    >
      {/* The idle label always occupies layout so the button never changes size. */}
      <span className={cx("inline-flex items-center gap-[inherit] transition-[opacity,transform] duration-200", status !== "idle" && status !== "error" && "-translate-y-[110%] opacity-0")}>
        {icon}
        {children}
        {iconRight && <span className="transition-transform duration-200 group-hover:translate-x-0.5">{iconRight}</span>}
      </span>
      <AnimatePresence initial={false}>
        {status === "loading" && (
          <m.span key="loading" className="absolute inset-0 grid place-items-center" {...swap}>
            <Spinner />
          </m.span>
        )}
        {status === "success" && (
          <m.span key="success" className="absolute inset-0 inline-flex items-center justify-center gap-2" {...swap}>
            <CheckDraw />
            {doneLabel}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
});

function CheckDraw() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <m.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, ease: [0.2, 0.9, 0.1, 1], delay: 0.06 }}
      />
    </svg>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
  active?: boolean;
}

/** Square icon-only button with an accessible label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", active, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-[var(--radius-btn)] border-2 text-ink",
        "transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-snap)] hover:bg-surface-2 active:scale-90",
        active ? "border-line bg-surface-2" : "border-transparent",
        size === "sm" ? "size-9" : "size-11",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
