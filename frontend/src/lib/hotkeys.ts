import { useEffect, useEffectEvent } from "react";

/** True when the event target is a text field, so global shortcuts should stand down. */
export function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/** Subscribes a keydown handler for the component's lifetime; the latest handler always runs. */
export function useKeydown(handler: (e: KeyboardEvent) => void, enabled = true) {
  const onKey = useEffectEvent(handler);
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [enabled]);
}
