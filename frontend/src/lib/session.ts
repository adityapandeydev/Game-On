import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, del, post } from "./api";
import { keys } from "./queries";
import type { GameId, RecordResult, SessionResponse, SessionResult } from "./types";

export type Phase = "idle" | "starting" | "playing" | "over";

export interface GameSession<S> {
  phase: Phase;
  id: string | null;
  seed: number;
  state: S | null;
  result: SessionResult | null;
  record: RecordResult | null;
  saved: boolean;
  /** True while an action request is in flight. */
  busy: boolean;
  error: string | null;
  start: (difficulty?: string) => Promise<SessionResponse<S> | null>;
  act: (action: object) => Promise<SessionResponse<S> | null>;
  /** Fire an action without blocking further input (e.g. Stackfall input batches). Calls are serialised. */
  queue: (action: object) => Promise<SessionResponse<S> | null>;
  reset: () => void;
  clearError: () => void;
}

/**
 * Drives one server-side game session. Actions are serialised so the server
 * always sees them in order, and a finished session refreshes stats and boards.
 */
export function useGameSession<S>(gameId: GameId): GameSession<S> {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<SessionResponse<S> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<string | null>(null);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const apply = useCallback(
    (r: SessionResponse<S>) => {
      setData(r);
      if (r.result) {
        setPhase("over");
        void qc.invalidateQueries({ queryKey: keys.board(gameId) });
        void qc.invalidateQueries({ queryKey: keys.board("global") });
        void qc.invalidateQueries({ queryKey: keys.me });
      } else {
        setPhase("playing");
      }
    },
    [qc, gameId],
  );

  const start = useCallback(
    async (difficulty?: string) => {
      setPhase("starting");
      setError(null);
      if (idRef.current) void del(`/sessions/${idRef.current}`).catch(() => {});
      try {
        const r = await post<SessionResponse<S>>(`/games/${gameId}/sessions`, difficulty ? { difficulty } : {});
        idRef.current = r.id;
        apply(r);
        return r;
      } catch (e) {
        setPhase("idle");
        setError((e as ApiError).message);
        return null;
      }
    },
    [gameId, apply],
  );

  const send = useCallback(
    (action: object, blocking: boolean) => {
      const run = async () => {
        const id = idRef.current;
        if (!id) return null;
        if (blocking) setBusy(true);
        try {
          const r = await post<SessionResponse<S>>(`/sessions/${id}/actions`, action);
          if (idRef.current === id) apply(r);
          return r;
        } catch (e) {
          const err = e as ApiError;
          if (err.code === "session_gone") {
            idRef.current = null;
            setPhase("idle");
          }
          setError(err.message);
          return null;
        } finally {
          if (blocking) setBusy(false);
        }
      };
      const p = chain.current.then(run, run);
      chain.current = p;
      return p;
    },
    [apply],
  );

  const act = useCallback((a: object) => send(a, true), [send]);
  const queue = useCallback((a: object) => send(a, false), [send]);

  const reset = useCallback(() => {
    if (idRef.current) void del(`/sessions/${idRef.current}`).catch(() => {});
    idRef.current = null;
    setData(null);
    setPhase("idle");
    setError(null);
  }, []);

  // Abandon the server session when leaving the page.
  useEffect(
    () => () => {
      if (idRef.current) void del(`/sessions/${idRef.current}`).catch(() => {});
    },
    [],
  );

  return {
    phase,
    id: data?.id ?? null,
    seed: data?.seed ?? 0,
    state: data?.state ?? null,
    result: data?.result ?? null,
    record: data?.record ?? null,
    saved: data?.saved ?? false,
    busy,
    error,
    start,
    act,
    queue,
    reset,
    clearError: useCallback(() => setError(null), []),
  };
}
