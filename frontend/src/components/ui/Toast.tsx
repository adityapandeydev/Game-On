import { AnimatePresence, m } from "motion/react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { cx } from "../../lib/format";
import { dismiss, useToasts } from "../../lib/toast";

export function Toaster() {
  const list = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className="chunk pointer-events-auto flex max-w-md items-center gap-3 py-2.5 pr-2 pl-3.5"
          >
            {t.kind === "error" ? <CircleAlert size={18} className="shrink-0 text-danger" /> : <CircleCheck size={18} className="shrink-0 text-success" />}
            <p className="text-sm font-semibold">{t.text}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className={cx("ml-1 grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink")}>
              <X size={16} />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
