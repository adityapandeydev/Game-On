import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

function apply(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

/**
 * Switches theme with a circular reveal from (x, y) when the View Transitions
 * API is available; otherwise switches instantly. The transition is one-shot.
 */
export function toggleTheme(x?: number, y?: number) {
  const next: Theme = current() === "dark" ? "light" : "dark";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || reduce || x === undefined || y === undefined) {
    apply(next);
    return;
  }
  const root = document.documentElement;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-r", `${r}px`);
  doc.startViewTransition(() => apply(next));
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    current,
    () => "light",
  );
}
