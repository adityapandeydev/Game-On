import { useSyncExternalStore } from "react";

type Toast = { id: number; kind: "error" | "success"; text: string };

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, kind: Toast["kind"] = "error") {
  const id = ++seq;
  toasts = [...toasts.slice(-2), { id, kind, text }];
  emit();
  window.setTimeout(() => dismiss(id), 4200);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}


export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
  );
}
