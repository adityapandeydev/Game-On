import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { AnimatePresence, m } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "../../lib/format";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled text input with an animated error line. Password fields get a reveal toggle. */
export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, hint, type, className, ...rest }, ref) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cx(
            "h-12 w-full rounded-[var(--radius-btn)] border-2 bg-surface px-3.5 text-ink outline-none placeholder:text-ink-3",
            "transition-[border-color,box-shadow] duration-150 focus:shadow-[3px_3px_0_var(--shadow)]",
            error ? "border-danger" : "border-line",
            isPassword && "pr-12",
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-lg text-ink-2 transition-transform hover:text-ink active:scale-90"
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {(error || hint) && (
          <m.p
            key={error ?? hint}
            id={`${id}-msg`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className={cx("text-sm", error ? "font-semibold text-danger" : "text-ink-3")}
          >
            {error ?? hint}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
});
