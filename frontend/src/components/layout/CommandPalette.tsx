import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { CornerDownLeft, Search } from "lucide-react";
import { useGames } from "../../lib/queries";
import { navItems } from "./nav";
import { cx } from "../../lib/format";
import { Kbd } from "../ui/Misc";

interface Entry {
  id: string;
  label: string;
  sub: string;
  to: string;
  accent?: string;
}

/** Ctrl/Cmd+K jump list: every game and page, filterable, keyboard-first. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <Palette onClose={onClose} />}</AnimatePresence>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { data: games } = useGames();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const all: Entry[] = [
      ...(games ?? []).map((g) => ({ id: g.id, label: g.title, sub: g.tagline, to: `/play/${g.id}`, accent: g.accent })),
      ...navItems.map((n) => ({ id: n.to, label: n.label, sub: "Page", to: n.to })),
    ];
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((e) => e.label.toLowerCase().includes(needle) || e.sub.toLowerCase().includes(needle)) : all;
  }, [games, q]);

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const go = (e?: Entry) => {
    if (!e) return;
    onClose();
    navigate(e.to);
  };

  return (
    <m.div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-[#17151c]/45 px-4 pt-[12vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <m.div
        role="dialog"
        aria-modal
        aria-label="Jump to"
        initial={{ y: -16, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.98, opacity: 0, transition: { duration: 0.12 } }}
        transition={{ type: "spring", stiffness: 520, damping: 36 }}
        className="chunk w-full max-w-lg overflow-hidden !shadow-[6px_6px_0_var(--shadow)]"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => Math.min(entries.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter") {
            go(entries[index]);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b-2 border-line px-4">
          <Search size={19} className="text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIndex(0);
            }}
            placeholder="Search games and pages"
            className="h-14 flex-1 bg-transparent text-[1.05rem] outline-none placeholder:text-ink-3"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">Nothing matches "{q}"</li>}
          {entries.map((e, i) => (
            <li key={e.id} role="option" aria-selected={i === index}>
              <button
                onMouseMove={() => setIndex(i)}
                onClick={() => go(e)}
                className={cx("relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === index ? "text-ink" : "text-ink-2")}
              >
                {i === index && <m.span layoutId="palette-hl" transition={{ type: "spring", stiffness: 700, damping: 45 }} className="absolute inset-0 rounded-xl bg-surface-2" />}
                <span data-accent={e.accent} className={cx("relative size-3.5 shrink-0 rounded-[5px] border-2 border-line", e.accent ? "bg-[var(--accent)]" : "bg-surface-3")} />
                <span className="relative min-w-0 flex-1">
                  <span className="block font-bold">{e.label}</span>
                  <span className="block truncate text-xs text-ink-3">{e.sub}</span>
                </span>
                {i === index && <CornerDownLeft size={16} className="relative text-ink-3" />}
              </button>
            </li>
          ))}
        </ul>
      </m.div>
    </m.div>
  );
}
