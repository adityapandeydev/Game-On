import { useCallback, useEffect, useRef, useState } from "react";
import type { ButtonStatus } from "../components/ui/Button";

/**
 * Wraps an async action with a button status: loading while it runs, success
 * (briefly) when it resolves, error (briefly) when it throws.
 */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, { successMs = 1200, errorMs = 900 } = {}) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      clearTimeout(timer.current);
      setStatus("loading");
      try {
        const r = await fn(...args);
        setStatus("success");
        timer.current = window.setTimeout(() => setStatus("idle"), successMs);
        return r;
      } catch {
        setStatus("error");
        timer.current = window.setTimeout(() => setStatus("idle"), errorMs);
        return undefined;
      }
    },
    [fn, successMs, errorMs],
  );
  return { status, run, setStatus };
}
